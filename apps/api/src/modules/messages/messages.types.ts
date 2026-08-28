import type { BookingStatus } from '../bookings/bookings.types';

export type MessageParticipant = {
  avatarUrl: string | null;
  id: string;
  name: string;
};

export type MessageBooking = {
  id: string;
  pickupDate: string;
  returnDate: string;
  status: BookingStatus;
  vehicle: {
    id: string;
    make: string;
    model: string;
  };
};

export type ConversationLastMessage = {
  body: string;
  createdAt: string;
  senderId: string;
};

export type ConversationSummary = {
  booking: MessageBooking;
  createdAt: string;
  id: string;
  lastMessage: ConversationLastMessage | null;
  otherParticipant: MessageParticipant;
  unreadCount: number;
  updatedAt: string;
};

export type ConversationMessage = {
  body: string;
  createdAt: string;
  id: string;
  isMine: boolean;
  readAt: string | null;
  sender: MessageParticipant;
};

export type ConversationThread = {
  conversation: ConversationSummary;
  messages: ConversationMessage[];
};

export type ConversationAccess = {
  booking: MessageBooking;
  conversationCreatedAt?: Date;
  conversationId?: string;
  conversationUpdatedAt?: Date;
  hostId: string;
  renterId: string;
};
