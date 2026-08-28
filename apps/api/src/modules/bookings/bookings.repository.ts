import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import {
  bookings,
  payments,
  vehicleAvailabilityBlocks,
  vehicleImages,
  vehicles,
  type BookingSelect,
} from '../../database/schema';
import type {
  BookableVehicle,
  Booking,
  BookingVehicle,
  CreateBookingRecord,
} from './bookings.types';

@Injectable()
export class BookingsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async findActiveVehicle(id: string): Promise<BookableVehicle | null> {
    const [vehicle] = await this.databaseService.database
      .select({
        dailyRate: vehicles.dailyRate,
        id: vehicles.id,
        ownerId: vehicles.ownerId,
      })
      .from(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.status, 'active')))
      .limit(1);

    return vehicle
      ? {
          dailyRate: Number(vehicle.dailyRate),
          id: vehicle.id,
          ownerId: vehicle.ownerId,
        }
      : null;
  }

  async hasConflict(
    vehicleId: string,
    pickupDate: string,
    returnDate: string,
  ): Promise<boolean> {
    const [bookingRows, blockRows] = await Promise.all([
      this.databaseService.database
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.vehicleId, vehicleId),
            inArray(bookings.status, ['pending', 'confirmed']),
            lt(bookings.pickupDate, returnDate),
            gt(bookings.returnDate, pickupDate),
          ),
        )
        .limit(1),
      this.databaseService.database
        .select({ id: vehicleAvailabilityBlocks.id })
        .from(vehicleAvailabilityBlocks)
        .where(
          and(
            eq(vehicleAvailabilityBlocks.vehicleId, vehicleId),
            lt(vehicleAvailabilityBlocks.startDate, returnDate),
            gt(vehicleAvailabilityBlocks.endDate, pickupDate),
          ),
        )
        .limit(1),
    ]);

    return Boolean(bookingRows[0] || blockRows[0]);
  }

  async create(input: CreateBookingRecord): Promise<Booking> {
    const [created] = await this.databaseService.database
      .insert(bookings)
      .values({
        dailyRate: String(input.dailyRate),
        pickupDate: input.pickupDate,
        renterId: input.renterId,
        returnDate: input.returnDate,
        totalDays: input.totalDays,
        totalPrice: String(input.totalPrice),
        vehicleId: input.vehicleId,
      })
      .returning();

    if (!created) {
      throw new Error('A reserva não foi persistida.');
    }

    return this.toDomain(created, await this.findVehicle(created.vehicleId));
  }

  async listByRenter(renterId: string): Promise<Booking[]> {
    const rows = await this.databaseService.database
      .select({ booking: bookings, vehicle: vehicles })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.renterId, renterId))
      .orderBy(desc(bookings.createdAt));
    const imageUrls = await this.findCoverImages(
      rows.map(({ vehicle }) => vehicle.id),
    );

    return rows.map(({ booking, vehicle }) =>
      this.toDomain(booking, {
        city: vehicle.city,
        id: vehicle.id,
        imageUrl: imageUrls.get(vehicle.id) ?? null,
        make: vehicle.make,
        model: vehicle.model,
        state: vehicle.state,
        year: vehicle.year,
      }),
    );
  }

  async findByIdForRenter(
    id: string,
    renterId: string,
  ): Promise<Booking | null> {
    const [row] = await this.databaseService.database
      .select({ booking: bookings, vehicle: vehicles })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(and(eq(bookings.id, id), eq(bookings.renterId, renterId)))
      .limit(1);

    if (!row) {
      return null;
    }

    const imageUrls = await this.findCoverImages([row.vehicle.id]);
    return this.toDomain(row.booking, {
      city: row.vehicle.city,
      id: row.vehicle.id,
      imageUrl: imageUrls.get(row.vehicle.id) ?? null,
      make: row.vehicle.make,
      model: row.vehicle.model,
      state: row.vehicle.state,
      year: row.vehicle.year,
    });
  }

  async findActivePaymentStatus(
    bookingId: string,
  ): Promise<'approved' | 'in_process' | 'pending' | null> {
    const [payment] = await this.databaseService.database
      .select({ status: payments.status })
      .from(payments)
      .where(
        and(
          eq(payments.bookingId, bookingId),
          inArray(payments.status, ['pending', 'in_process', 'approved']),
        ),
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return payment?.status === 'pending' ||
      payment?.status === 'in_process' ||
      payment?.status === 'approved'
      ? payment.status
      : null;
  }

  async cancel(id: string, renterId: string): Promise<Booking | null> {
    const [updated] = await this.databaseService.database
      .update(bookings)
      .set({
        cancelledAt: new Date(),
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bookings.id, id),
          eq(bookings.renterId, renterId),
          inArray(bookings.status, ['pending', 'confirmed']),
        ),
      )
      .returning({ id: bookings.id });

    return updated ? this.findByIdForRenter(updated.id, renterId) : null;
  }

  private async findVehicle(vehicleId: string): Promise<BookingVehicle> {
    const [vehicle] = await this.databaseService.database
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId))
      .limit(1);

    if (!vehicle) {
      throw new Error('O veículo da reserva não foi encontrado.');
    }

    const images = await this.findCoverImages([vehicleId]);
    return {
      city: vehicle.city,
      id: vehicle.id,
      imageUrl: images.get(vehicle.id) ?? null,
      make: vehicle.make,
      model: vehicle.model,
      state: vehicle.state,
      year: vehicle.year,
    };
  }

  private async findCoverImages(
    vehicleIds: string[],
  ): Promise<Map<string, string>> {
    if (vehicleIds.length === 0) {
      return new Map();
    }

    const rows = await this.databaseService.database
      .select({
        storageKey: vehicleImages.storageKey,
        vehicleId: vehicleImages.vehicleId,
      })
      .from(vehicleImages)
      .where(
        and(
          inArray(vehicleImages.vehicleId, vehicleIds),
          eq(vehicleImages.isCover, true),
        ),
      );

    return new Map(rows.map((row) => [row.vehicleId, row.storageKey]));
  }

  private toDomain(booking: BookingSelect, vehicle: BookingVehicle): Booking {
    return {
      cancelledAt: booking.cancelledAt?.toISOString() ?? null,
      createdAt: booking.createdAt.toISOString(),
      currency: 'BRL',
      dailyRate: Number(booking.dailyRate),
      id: booking.id,
      pickupDate: booking.pickupDate,
      renterId: booking.renterId,
      returnDate: booking.returnDate,
      status: booking.status,
      totalDays: booking.totalDays,
      totalPrice: Number(booking.totalPrice),
      updatedAt: booking.updatedAt.toISOString(),
      vehicle,
    };
  }
}
