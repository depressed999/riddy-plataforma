import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull, ne, or, sql } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import {
  bookings,
  messageConversations,
  messages,
  users,
  vehicles,
} from '../../database/schema';
import type {
  ConversationAccess,
  ConversationLastMessage,
  ConversationMessage,
  ConversationSummary,
  MessageParticipant,
} from './messages.types';

@Injectable()
export class MessagesRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async findBookingAccess(
    bookingId: string,
    userId: string,
  ): Promise<ConversationAccess | null> {
    const [row] = await this.databaseService.database
      .select({ booking: bookings, vehicle: vehicles })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(
        and(
          eq(bookings.id, bookingId),
          or(eq(bookings.renterId, userId), eq(vehicles.ownerId, userId)),
        ),
      )
      .limit(1);

    return row
      ? {
          booking: {
            id: row.booking.id,
            pickupDate: row.booking.pickupDate,
            returnDate: row.booking.returnDate,
            status: row.booking.status,
            vehicle: {
              id: row.vehicle.id,
              make: row.vehicle.make,
              model: row.vehicle.model,
            },
          },
          hostId: row.vehicle.ownerId,
          renterId: row.booking.renterId,
        }
      : null;
  }

  async findConversationAccess(
    conversationId: string,
    userId: string,
  ): Promise<ConversationAccess | null> {
    const [row] = await this.databaseService.database
      .select({
        booking: bookings,
        conversation: messageConversations,
        vehicle: vehicles,
      })
      .from(messageConversations)
      .innerJoin(bookings, eq(messageConversations.bookingId, bookings.id))
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(
        and(
          eq(messageConversations.id, conversationId),
          or(eq(bookings.renterId, userId), eq(vehicles.ownerId, userId)),
        ),
      )
      .limit(1);

    return row
      ? {
          booking: {
            id: row.booking.id,
            pickupDate: row.booking.pickupDate,
            returnDate: row.booking.returnDate,
            status: row.booking.status,
            vehicle: {
              id: row.vehicle.id,
              make: row.vehicle.make,
              model: row.vehicle.model,
            },
          },
          conversationCreatedAt: row.conversation.createdAt,
          conversationId: row.conversation.id,
          conversationUpdatedAt: row.conversation.updatedAt,
          hostId: row.vehicle.ownerId,
          renterId: row.booking.renterId,
        }
      : null;
  }

  async findConversationIdByBooking(bookingId: string): Promise<string | null> {
    const [conversation] = await this.databaseService.database
      .select({ id: messageConversations.id })
      .from(messageConversations)
      .where(eq(messageConversations.bookingId, bookingId))
      .limit(1);
    return conversation?.id ?? null;
  }

  async createConversation(bookingId: string): Promise<string> {
    await this.databaseService.database
      .insert(messageConversations)
      .values({ bookingId })
      .onConflictDoNothing({ target: messageConversations.bookingId });
    const id = await this.findConversationIdByBooking(bookingId);
    if (!id) {
      throw new Error('A conversa não foi persistida.');
    }
    return id;
  }

  async findParticipant(userId: string): Promise<MessageParticipant | null> {
    const [user] = await this.databaseService.database
      .select({ avatarUrl: users.avatarUrl, id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user ?? null;
  }

  async listConversationAccesses(
    userId: string,
  ): Promise<ConversationAccess[]> {
    const rows = await this.databaseService.database
      .select({
        booking: bookings,
        conversation: messageConversations,
        vehicle: vehicles,
      })
      .from(messageConversations)
      .innerJoin(bookings, eq(messageConversations.bookingId, bookings.id))
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(or(eq(bookings.renterId, userId), eq(vehicles.ownerId, userId)))
      .orderBy(
        desc(
          sql`coalesce(${messageConversations.lastMessageAt}, ${messageConversations.createdAt})`,
        ),
      );

    return rows.map((row) => ({
      booking: {
        id: row.booking.id,
        pickupDate: row.booking.pickupDate,
        returnDate: row.booking.returnDate,
        status: row.booking.status,
        vehicle: {
          id: row.vehicle.id,
          make: row.vehicle.make,
          model: row.vehicle.model,
        },
      },
      conversationCreatedAt: row.conversation.createdAt,
      conversationId: row.conversation.id,
      conversationUpdatedAt: row.conversation.updatedAt,
      hostId: row.vehicle.ownerId,
      renterId: row.booking.renterId,
    }));
  }

  async getSummaryData(
    conversationId: string,
    userId: string,
  ): Promise<{
    lastMessage: ConversationLastMessage | null;
    unreadCount: number;
  }> {
    const [[lastMessage], [unread]] = await Promise.all([
      this.databaseService.database
        .select({
          body: messages.body,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt), desc(messages.id))
        .limit(1),
      this.databaseService.database
        .select({ value: count() })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            ne(messages.senderId, userId),
            isNull(messages.readAt),
          ),
        ),
    ]);

    return {
      lastMessage: lastMessage
        ? {
            body: lastMessage.body,
            createdAt: lastMessage.createdAt.toISOString(),
            senderId: lastMessage.senderId,
          }
        : null,
      unreadCount: unread?.value ?? 0,
    };
  }

  async listMessages(
    conversationId: string,
    userId: string,
  ): Promise<ConversationMessage[]> {
    const rows = await this.databaseService.database
      .select({ message: messages, sender: users })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(100);

    return rows.reverse().map(({ message, sender }) => ({
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      id: message.id,
      isMine: message.senderId === userId,
      readAt: message.readAt?.toISOString() ?? null,
      sender: {
        avatarUrl: sender.avatarUrl,
        id: sender.id,
        name: sender.name,
      },
    }));
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<ConversationMessage> {
    const message = await this.databaseService.database.transaction(
      async (transaction) => {
        const now = new Date();
        const [created] = await transaction
          .insert(messages)
          .values({ body, conversationId, senderId })
          .returning();
        if (!created) {
          throw new Error('A mensagem não foi persistida.');
        }
        await transaction
          .update(messageConversations)
          .set({ lastMessageAt: now, updatedAt: now })
          .where(eq(messageConversations.id, conversationId));
        return created;
      },
    );
    const sender = await this.findParticipant(senderId);
    if (!sender) {
      throw new Error('O remetente da mensagem não foi encontrado.');
    }
    return {
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      id: message.id,
      isMine: true,
      readAt: null,
      sender,
    };
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.databaseService.database
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId),
          isNull(messages.readAt),
        ),
      );
  }

  toSummary(
    access: ConversationAccess,
    otherParticipant: MessageParticipant,
    data: {
      lastMessage: ConversationLastMessage | null;
      unreadCount: number;
    },
  ): ConversationSummary {
    if (
      !access.conversationId ||
      !access.conversationCreatedAt ||
      !access.conversationUpdatedAt
    ) {
      throw new Error('A conversa não possui metadados completos.');
    }
    return {
      booking: access.booking,
      createdAt: access.conversationCreatedAt.toISOString(),
      id: access.conversationId,
      lastMessage: data.lastMessage,
      otherParticipant,
      unreadCount: data.unreadCount,
      updatedAt: access.conversationUpdatedAt.toISOString(),
    };
  }
}
