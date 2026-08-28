import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './auth.schema';
import { bookings } from './bookings.schema';

export const messageConversations = pgTable(
  'message_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('message_conversations_booking_unique').on(table.bookingId),
    index('message_conversations_last_message_idx').on(table.lastMessageAt),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => messageConversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('messages_conversation_created_idx').on(
      table.conversationId,
      table.createdAt,
    ),
    index('messages_sender_idx').on(table.senderId),
    index('messages_conversation_read_idx').on(
      table.conversationId,
      table.readAt,
    ),
    check(
      'messages_body_length_check',
      sql`char_length(trim(${table.body})) between 1 and 2000`,
    ),
  ],
);

export const messageConversationsRelations = relations(
  messageConversations,
  ({ many, one }) => ({
    booking: one(bookings, {
      fields: [messageConversations.bookingId],
      references: [bookings.id],
    }),
    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(messageConversations, {
    fields: [messages.conversationId],
    references: [messageConversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export type MessageConversationSelect =
  typeof messageConversations.$inferSelect;
export type MessageSelect = typeof messages.$inferSelect;
