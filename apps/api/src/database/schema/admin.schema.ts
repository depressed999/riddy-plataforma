import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema';

export const adminAuditEvents = pgTable(
  'admin_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: varchar('action', { length: 80 }).notNull(),
    targetType: varchar('target_type', { length: 40 }).notNull(),
    targetId: uuid('target_id'),
    reason: varchar('reason', { length: 500 }).notNull(),
    metadata: jsonb('metadata')
      .$type<Record<string, string | number | boolean | null>>()
      .default({})
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('admin_audit_events_actor_idx').on(table.actorUserId),
    index('admin_audit_events_target_idx').on(table.targetType, table.targetId),
    index('admin_audit_events_created_at_idx').on(table.createdAt),
  ],
);

export const adminAuditEventsRelations = relations(
  adminAuditEvents,
  ({ one }) => ({
    actor: one(users, {
      fields: [adminAuditEvents.actorUserId],
      references: [users.id],
    }),
  }),
);

export type AdminAuditEventSelect = typeof adminAuditEvents.$inferSelect;
