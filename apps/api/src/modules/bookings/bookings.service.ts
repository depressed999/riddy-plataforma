import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BookingsRepository } from './bookings.repository';
import type {
  BookableVehicle,
  Booking,
  BookingDates,
  BookingQuote,
} from './bookings.types';

const millisecondsPerDay = 86_400_000;

@Injectable()
export class BookingsService {
  constructor(
    @Inject(BookingsRepository)
    private readonly bookingsRepository: BookingsRepository,
  ) {}

  async quote(input: BookingDates): Promise<BookingQuote> {
    const prepared = await this.prepare(input);
    return prepared.quote;
  }

  async create(input: BookingDates, renterId: string): Promise<Booking> {
    const { quote, vehicle } = await this.prepare(input);

    if (vehicle.ownerId === renterId) {
      throw new ForbiddenException('Você não pode reservar o próprio veículo.');
    }

    if (!quote.available) {
      throw new ConflictException(
        'O veículo não está disponível no período selecionado.',
      );
    }

    try {
      return await this.bookingsRepository.create({
        dailyRate: quote.dailyRate,
        pickupDate: quote.pickupDate,
        renterId,
        returnDate: quote.returnDate,
        totalDays: quote.totalDays,
        totalPrice: quote.totalPrice,
        vehicleId: quote.vehicleId,
      });
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw new ConflictException(
          'O veículo acabou de ficar indisponível neste período.',
        );
      }

      throw error;
    }
  }

  listMine(renterId: string): Promise<Booking[]> {
    return this.bookingsRepository.listByRenter(renterId);
  }

  async cancel(id: string, renterId: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findByIdForRenter(
      id,
      renterId,
    );

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new ConflictException('Esta reserva não pode mais ser cancelada.');
    }

    if (booking.pickupDate <= today()) {
      throw new ConflictException(
        'Reservas iniciadas não podem ser canceladas por este fluxo.',
      );
    }

    const paymentStatus = await this.bookingsRepository.findActivePaymentStatus(
      booking.id,
    );
    if (paymentStatus === 'approved') {
      throw new ConflictException(
        'Esta reserva possui pagamento aprovado. Solicite o reembolso pelo fluxo de pagamento.',
      );
    }
    if (paymentStatus) {
      throw new ConflictException(
        'Cancele o pagamento pendente antes de cancelar a reserva.',
      );
    }

    const cancelled = await this.bookingsRepository.cancel(id, renterId);

    if (!cancelled) {
      throw new ConflictException('Esta reserva não pode mais ser cancelada.');
    }

    return cancelled;
  }

  private async prepare(
    input: BookingDates,
  ): Promise<{ quote: BookingQuote; vehicle: BookableVehicle }> {
    const totalDays = calculateDays(input.pickupDate, input.returnDate);

    if (input.pickupDate < today()) {
      throw new BadRequestException('A retirada não pode estar no passado.');
    }

    if (totalDays < 1) {
      throw new BadRequestException(
        'A devolução deve ser posterior à retirada.',
      );
    }

    const vehicle = await this.bookingsRepository.findActiveVehicle(
      input.vehicleId,
    );

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    const available = !(await this.bookingsRepository.hasConflict(
      vehicle.id,
      input.pickupDate,
      input.returnDate,
    ));

    return {
      quote: {
        available,
        currency: 'BRL',
        dailyRate: vehicle.dailyRate,
        pickupDate: input.pickupDate,
        returnDate: input.returnDate,
        totalDays,
        totalPrice: roundMoney(vehicle.dailyRate * totalDays),
        vehicleId: vehicle.id,
      },
      vehicle,
    };
  }
}

function calculateDays(pickupDate: string, returnDate: string): number {
  const pickup = Date.parse(`${pickupDate}T00:00:00Z`);
  const returnAt = Date.parse(`${returnDate}T00:00:00Z`);

  if (!Number.isFinite(pickup) || !Number.isFinite(returnAt)) {
    return 0;
  }

  return Math.round((returnAt - pickup) / millisecondsPerDay);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isExclusionViolation(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '23P01',
  );
}
