import { relations, sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema';
import { vehicles } from './vehicles.schema';

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
]);

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id),
    renterId: uuid('renter_id')
      .notNull()
      .references(() => users.id),
    pickupDate: date('pickup_date', { mode: 'string' }).notNull(),
    returnDate: date('return_date', { mode: 'string' }).notNull(),
    dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }).notNull(),
    totalDays: integer('total_days').notNull(),
    totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
    status: bookingStatusEnum('status').default('pending').notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('bookings_vehicle_id_idx').on(table.vehicleId),
    index('bookings_renter_id_idx').on(table.renterId),
    index('bookings_status_idx').on(table.status),
    index('bookings_pickup_return_idx').on(table.pickupDate, table.returnDate),
    check(
      'bookings_return_after_pickup_check',
      sql`${table.returnDate} > ${table.pickupDate}`,
    ),
    check('bookings_total_days_check', sql`${table.totalDays} > 0`),
    check('bookings_daily_rate_check', sql`${table.dailyRate} >= 0`),
    check('bookings_total_price_check', sql`${table.totalPrice} >= 0`),
  ],
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
  renter: one(users, {
    fields: [bookings.renterId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [bookings.vehicleId],
    references: [vehicles.id],
  }),
}));

export type BookingInsert = typeof bookings.$inferInsert;
export type BookingSelect = typeof bookings.$inferSelect;
