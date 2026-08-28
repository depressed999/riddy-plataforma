import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { bookings } from './bookings.schema';

export const paymentMethodEnum = pgEnum('payment_method', ['card', 'pix']);

export const paymentStatusEnum = pgEnum('payment_status', [
  'created',
  'pending',
  'in_process',
  'approved',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back',
  'error',
]);

export const paymentActionTypeEnum = pgEnum('payment_action_type', [
  'cancel',
  'refund',
]);

export const paymentActionStatusEnum = pgEnum('payment_action_status', [
  'processing',
  'succeeded',
  'failed',
]);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id),
    providerPaymentId: text('provider_payment_id'),
    idempotencyKey: uuid('idempotency_key').notNull(),
    method: paymentMethodEnum('method').notNull(),
    paymentMethodId: text('payment_method_id').notNull(),
    paymentTypeId: text('payment_type_id'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').default('BRL').notNull(),
    status: paymentStatusEnum('status').default('created').notNull(),
    statusDetail: text('status_detail'),
    pixQrCode: text('pix_qr_code'),
    pixQrCodeBase64: text('pix_qr_code_base64'),
    pixTicketUrl: text('pix_ticket_url'),
    failureMessage: text('failure_message'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('payments_idempotency_key_unique').on(table.idempotencyKey),
    uniqueIndex('payments_provider_payment_id_unique').on(
      table.providerPaymentId,
    ),
    uniqueIndex('payments_booking_active_unique')
      .on(table.bookingId)
      .where(
        sql`${table.status} in ('created', 'pending', 'in_process', 'approved')`,
      ),
    index('payments_booking_id_idx').on(table.bookingId),
    index('payments_status_idx').on(table.status),
    check('payments_amount_positive_check', sql`${table.amount} > 0`),
  ],
);

export const paymentActions = pgTable(
  'payment_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id),
    type: paymentActionTypeEnum('type').notNull(),
    idempotencyKey: uuid('idempotency_key').notNull(),
    providerActionId: text('provider_action_id'),
    amount: numeric('amount', { precision: 12, scale: 2 }),
    status: paymentActionStatusEnum('status').default('processing').notNull(),
    failureMessage: text('failure_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('payment_actions_idempotency_key_unique').on(
      table.idempotencyKey,
    ),
    index('payment_actions_payment_id_idx').on(table.paymentId),
  ],
);

export const paymentWebhookEvents = pgTable(
  'payment_webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventKey: text('event_key').notNull(),
    providerPaymentId: text('provider_payment_id').notNull(),
    action: text('action').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('payment_webhook_events_event_key_unique').on(table.eventKey),
    index('payment_webhook_events_provider_id_idx').on(table.providerPaymentId),
  ],
);

export const paymentsRelations = relations(payments, ({ many, one }) => ({
  actions: many(paymentActions),
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const paymentActionsRelations = relations(paymentActions, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentActions.paymentId],
    references: [payments.id],
  }),
}));

export type PaymentSelect = typeof payments.$inferSelect;
export type PaymentActionSelect = typeof paymentActions.$inferSelect;
