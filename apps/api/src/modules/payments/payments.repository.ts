import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import {
  bookings,
  paymentActions,
  payments,
  paymentWebhookEvents,
  users,
  vehicles,
  type PaymentActionSelect,
  type PaymentSelect,
} from '../../database/schema';
import type {
  Payment,
  PaymentAction,
  PaymentBooking,
  PaymentMethod,
  ProviderPayment,
} from './payments.types';

@Injectable()
export class PaymentsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async findBookingForRenter(
    bookingId: string,
    renterId: string,
  ): Promise<PaymentBooking | null> {
    const [row] = await this.databaseService.database
      .select({ booking: bookings, renter: users, vehicle: vehicles })
      .from(bookings)
      .innerJoin(users, eq(bookings.renterId, users.id))
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.renterId, renterId)))
      .limit(1);

    return row
      ? {
          id: row.booking.id,
          pickupDate: row.booking.pickupDate,
          renterEmail: row.renter.email,
          returnDate: row.booking.returnDate,
          status: row.booking.status,
          totalDays: row.booking.totalDays,
          totalPrice: Number(row.booking.totalPrice),
          vehicle: {
            city: row.vehicle.city,
            id: row.vehicle.id,
            make: row.vehicle.make,
            model: row.vehicle.model,
            state: row.vehicle.state,
            year: row.vehicle.year,
          },
        }
      : null;
  }

  async findLatestByBooking(bookingId: string): Promise<Payment | null> {
    const [payment] = await this.databaseService.database
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return payment ? this.toDomain(payment) : null;
  }

  async findActiveByBooking(bookingId: string): Promise<Payment | null> {
    const [payment] = await this.databaseService.database
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.bookingId, bookingId),
          inArray(payments.status, [
            'created',
            'pending',
            'in_process',
            'approved',
          ]),
        ),
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return payment ? this.toDomain(payment) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Payment | null> {
    const [payment] = await this.databaseService.database
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, key))
      .limit(1);

    return payment ? this.toDomain(payment) : null;
  }

  async findByIdForRenter(
    id: string,
    renterId: string,
  ): Promise<Payment | null> {
    const [payment] = await this.databaseService.database
      .select({ payment: payments })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(and(eq(payments.id, id), eq(bookings.renterId, renterId)))
      .limit(1);

    return payment ? this.toDomain(payment.payment) : null;
  }

  async findByProviderId(providerPaymentId: string): Promise<Payment | null> {
    const [payment] = await this.databaseService.database
      .select()
      .from(payments)
      .where(eq(payments.providerPaymentId, providerPaymentId))
      .limit(1);

    return payment ? this.toDomain(payment) : null;
  }

  async createAttempt(input: {
    amount: number;
    bookingId: string;
    idempotencyKey: string;
    method: PaymentMethod;
    paymentMethodId: string;
  }): Promise<Payment> {
    const [created] = await this.databaseService.database
      .insert(payments)
      .values({
        amount: String(input.amount),
        bookingId: input.bookingId,
        idempotencyKey: input.idempotencyKey,
        method: input.method,
        paymentMethodId: input.paymentMethodId,
      })
      .onConflictDoNothing({ target: payments.idempotencyKey })
      .returning();

    if (created) {
      return this.toDomain(created);
    }

    const existing = await this.findByIdempotencyKey(input.idempotencyKey);
    if (!existing) {
      throw new Error('A tentativa de pagamento não foi persistida.');
    }
    return existing;
  }

  async updateFromProvider(
    id: string,
    provider: ProviderPayment,
  ): Promise<Payment> {
    const now = new Date();
    const [updated] = await this.databaseService.database
      .update(payments)
      .set({
        approvedAt: provider.approvedAt
          ? new Date(provider.approvedAt)
          : undefined,
        cancelledAt: provider.status === 'cancelled' ? now : undefined,
        failureMessage: null,
        paymentMethodId: provider.paymentMethodId,
        paymentTypeId: provider.paymentTypeId,
        pixQrCode: provider.pixQrCode,
        pixQrCodeBase64: provider.pixQrCodeBase64,
        pixTicketUrl: provider.pixTicketUrl,
        providerPaymentId: provider.id,
        refundedAt: provider.status === 'refunded' ? now : undefined,
        status: provider.status,
        statusDetail: provider.statusDetail,
        updatedAt: now,
      })
      .where(eq(payments.id, id))
      .returning();

    if (!updated) {
      throw new Error('O pagamento não foi atualizado.');
    }
    return this.toDomain(updated);
  }

  async markFailure(id: string, message: string): Promise<Payment> {
    const [updated] = await this.databaseService.database
      .update(payments)
      .set({ failureMessage: message, status: 'error', updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();

    if (!updated) {
      throw new Error('A falha do pagamento não foi persistida.');
    }
    return this.toDomain(updated);
  }

  async updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled',
  ): Promise<void> {
    await this.databaseService.database
      .update(bookings)
      .set({
        cancelledAt: status === 'cancelled' ? new Date() : null,
        status,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));
  }

  async createAction(input: {
    idempotencyKey: string;
    paymentId: string;
    type: 'cancel' | 'refund';
  }): Promise<PaymentAction> {
    const [created] = await this.databaseService.database
      .insert(paymentActions)
      .values(input)
      .onConflictDoNothing({ target: paymentActions.idempotencyKey })
      .returning();

    if (created) {
      return this.actionToDomain(created);
    }

    const existing = await this.findActionByKey(input.idempotencyKey);
    if (!existing) {
      throw new Error('A operação financeira não foi persistida.');
    }
    return existing;
  }

  async completeAction(id: string, providerActionId?: string): Promise<void> {
    await this.databaseService.database
      .update(paymentActions)
      .set({
        failureMessage: null,
        providerActionId,
        status: 'succeeded',
        updatedAt: new Date(),
      })
      .where(eq(paymentActions.id, id));
  }

  async failAction(id: string, message: string): Promise<void> {
    await this.databaseService.database
      .update(paymentActions)
      .set({ failureMessage: message, status: 'failed', updatedAt: new Date() })
      .where(eq(paymentActions.id, id));
  }

  async claimWebhook(input: {
    action: string;
    eventKey: string;
    payload: Record<string, unknown>;
    providerPaymentId: string;
  }): Promise<boolean> {
    const [created] = await this.databaseService.database
      .insert(paymentWebhookEvents)
      .values(input)
      .onConflictDoNothing({ target: paymentWebhookEvents.eventKey })
      .returning({ id: paymentWebhookEvents.id });

    if (created) {
      return true;
    }

    const [existing] = await this.databaseService.database
      .select({ processedAt: paymentWebhookEvents.processedAt })
      .from(paymentWebhookEvents)
      .where(eq(paymentWebhookEvents.eventKey, input.eventKey))
      .limit(1);
    return Boolean(existing && !existing.processedAt);
  }

  async markWebhookProcessed(eventKey: string): Promise<void> {
    await this.databaseService.database
      .update(paymentWebhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(paymentWebhookEvents.eventKey, eventKey));
  }

  async findActionByKey(key: string): Promise<PaymentAction | null> {
    const [action] = await this.databaseService.database
      .select()
      .from(paymentActions)
      .where(eq(paymentActions.idempotencyKey, key))
      .limit(1);
    return action ? this.actionToDomain(action) : null;
  }

  private toDomain(payment: PaymentSelect): Payment {
    return {
      amount: Number(payment.amount),
      approvedAt: payment.approvedAt?.toISOString() ?? null,
      bookingId: payment.bookingId,
      cancelledAt: payment.cancelledAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      currency: 'BRL',
      failureMessage: payment.failureMessage,
      id: payment.id,
      method: payment.method,
      paymentMethodId: payment.paymentMethodId,
      paymentTypeId: payment.paymentTypeId,
      pixQrCode: payment.pixQrCode,
      pixQrCodeBase64: payment.pixQrCodeBase64,
      pixTicketUrl: payment.pixTicketUrl,
      providerPaymentId: payment.providerPaymentId,
      refundedAt: payment.refundedAt?.toISOString() ?? null,
      status: payment.status,
      statusDetail: payment.statusDetail,
      updatedAt: payment.updatedAt.toISOString(),
    };
  }

  private actionToDomain(action: PaymentActionSelect): PaymentAction {
    return {
      id: action.id,
      paymentId: action.paymentId,
      status: action.status,
      type: action.type,
    };
  }
}
