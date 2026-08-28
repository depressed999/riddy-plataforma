import { relations, sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema';
import { vehicles } from './vehicles.schema';

export const hostProfileStatusEnum = pgEnum('host_profile_status', [
  'onboarding',
  'active',
  'suspended',
]);

export const hostProfiles = pgTable(
  'host_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    bio: text('bio'),
    supportPhone: varchar('support_phone', { length: 20 }),
    status: hostProfileStatusEnum('status').default('onboarding').notNull(),
    termsAcceptedAt: timestamp('terms_accepted_at', {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('host_profiles_user_id_unique').on(table.userId),
    index('host_profiles_status_idx').on(table.status),
  ],
);

export const vehicleAvailabilityBlocks = pgTable(
  'vehicle_availability_blocks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    hostId: uuid('host_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    reason: varchar('reason', { length: 240 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('vehicle_availability_blocks_vehicle_idx').on(table.vehicleId),
    index('vehicle_availability_blocks_host_idx').on(table.hostId),
    index('vehicle_availability_blocks_dates_idx').on(
      table.startDate,
      table.endDate,
    ),
    uniqueIndex('vehicle_availability_blocks_period_unique').on(
      table.vehicleId,
      table.startDate,
      table.endDate,
    ),
    check(
      'vehicle_availability_blocks_end_after_start_check',
      sql`${table.endDate} > ${table.startDate}`,
    ),
  ],
);

export const hostProfilesRelations = relations(hostProfiles, ({ one }) => ({
  user: one(users, {
    fields: [hostProfiles.userId],
    references: [users.id],
  }),
}));

export const vehicleAvailabilityBlocksRelations = relations(
  vehicleAvailabilityBlocks,
  ({ one }) => ({
    host: one(users, {
      fields: [vehicleAvailabilityBlocks.hostId],
      references: [users.id],
    }),
    vehicle: one(vehicles, {
      fields: [vehicleAvailabilityBlocks.vehicleId],
      references: [vehicles.id],
    }),
  }),
);

export type HostProfileSelect = typeof hostProfiles.$inferSelect;
export type VehicleAvailabilityBlockSelect =
  typeof vehicleAvailabilityBlocks.$inferSelect;
