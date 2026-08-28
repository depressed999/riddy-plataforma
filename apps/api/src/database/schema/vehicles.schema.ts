import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  geometry,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const vehicleTypeEnum = pgEnum('vehicle_type', ['car', 'motorcycle']);

export const vehicleStatusEnum = pgEnum('vehicle_status', [
  'draft',
  'active',
  'inactive',
  'maintenance',
]);

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').notNull(),
    type: vehicleTypeEnum('type').notNull(),
    make: varchar('make', { length: 80 }).notNull(),
    model: varchar('model', { length: 120 }).notNull(),
    year: integer('year').notNull(),
    description: text('description').notNull(),
    amenities: text('amenities')
      .array()
      .default(sql`ARRAY[]::text[]`)
      .notNull(),
    dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }).notNull(),
    transmission: varchar('transmission', { length: 40 }).notNull(),
    fuelType: varchar('fuel_type', { length: 40 }).notNull(),
    seats: integer('seats').notNull(),
    city: varchar('city', { length: 120 }).notNull(),
    state: varchar('state', { length: 2 }).notNull(),
    location: geometry('location', {
      mode: 'xy',
      srid: 4326,
      type: 'point',
    }).notNull(),
    status: vehicleStatusEnum('status').default('draft').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('vehicles_owner_id_idx').on(table.ownerId),
    index('vehicles_status_idx').on(table.status),
    index('vehicles_location_gist_idx').using('gist', table.location),
    index('vehicles_make_model_idx').on(table.make, table.model),
  ],
);

export const vehicleImages = pgTable(
  'vehicle_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vehicleId: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    altText: varchar('alt_text', { length: 240 }).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isCover: boolean('is_cover').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('vehicle_images_vehicle_id_idx').on(table.vehicleId),
    uniqueIndex('vehicle_images_storage_key_unique').on(table.storageKey),
    uniqueIndex('vehicle_images_one_cover_per_vehicle')
      .on(table.vehicleId)
      .where(sql`${table.isCover} = true`),
  ],
);

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  images: many(vehicleImages),
}));

export const vehicleImagesRelations = relations(vehicleImages, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleImages.vehicleId],
    references: [vehicles.id],
  }),
}));

export type VehicleInsert = typeof vehicles.$inferInsert;
export type VehicleSelect = typeof vehicles.$inferSelect;
export type VehicleImageInsert = typeof vehicleImages.$inferInsert;
export type VehicleImageSelect = typeof vehicleImages.$inferSelect;
