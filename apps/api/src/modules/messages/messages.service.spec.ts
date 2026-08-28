import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import type { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';
import type { ConversationAccess, ConversationSummary } from './messages.types';

const renterId = '11111111-1111-4111-8111-111111111111';
const hostId = '22222222-2222-4222-8222-222222222222';
const bookingId = '33333333-3333-4333-8333-333333333333';
const conversationId = '44444444-4444-4444-8444-444444444444';

describe('MessagesService', () => {
  let repository: jest.Mocked<MessagesRepository>;
  let service: MessagesService;

  beforeEach(() => {
    repository = {
      createConversation: jest.fn(),
      createMessage: jest.fn(),
      findBookingAccess: jest.fn(),
      findConversationAccess: jest.fn(),
      findConversationIdByBooking: jest.fn(),
      findParticipant: jest.fn(),
      getSummaryData: jest.fn(),
      listConversationAccesses: jest.fn(),
      listMessages: jest.fn(),
      markAsRead: jest.fn(),
      toSummary: jest.fn(),
    } as unknown as jest.Mocked<MessagesRepository>;
    service = new MessagesService(repository);
    repository.findBookingAccess.mockResolvedValue(accessFixture(false));
    repository.findConversationAccess.mockResolvedValue(accessFixture());
    repository.findParticipant.mockResolvedValue({
      avatarUrl: null,
      id: hostId,
      name: 'Anfitrião QA',
    });
    repository.createConversation.mockResolvedValue(conversationId);
    repository.getSummaryData.mockResolvedValue({
      lastMessage: null,
      unreadCount: 0,
    });
    repository.toSummary.mockReturnValue(summaryFixture());
    repository.listMessages.mockResolvedValue([]);
  });

  it('starts or reuses the conversation for an accessible booking', async () => {
    await expect(
      service.startConversation(bookingId, renterId),
    ).resolves.toEqual(summaryFixture());

    expect(repository.createConversation).toHaveBeenCalledWith(bookingId);
    expect(repository.findConversationAccess).toHaveBeenCalledWith(
      conversationId,
      renterId,
    );
  });

  it('hides bookings that do not belong to the authenticated user', async () => {
    repository.findBookingAccess.mockResolvedValue(null);

    await expect(
      service.startConversation(bookingId, renterId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createConversation).not.toHaveBeenCalled();
  });

  it('does not create a conversation when the other account is unavailable', async () => {
    repository.findParticipant.mockResolvedValue(null);

    await expect(
      service.startConversation(bookingId, renterId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists only summaries returned from accessible conversations', async () => {
    repository.listConversationAccesses.mockResolvedValue([accessFixture()]);

    await expect(service.listConversations(renterId)).resolves.toEqual([
      summaryFixture(),
    ]);
    expect(repository.findParticipant).toHaveBeenCalledWith(hostId);
  });

  it('loads the thread after checking participant access', async () => {
    await expect(service.getThread(conversationId, renterId)).resolves.toEqual({
      conversation: summaryFixture(),
      messages: [],
    });
  });

  it('normalizes and sends text as the authenticated participant', async () => {
    repository.createMessage.mockResolvedValue({
      body: 'Olá!\nTudo bem?',
      createdAt: new Date().toISOString(),
      id: '55555555-5555-4555-8555-555555555555',
      isMine: true,
      readAt: null,
      sender: { avatarUrl: null, id: renterId, name: 'Locatário QA' },
    });

    await service.sendMessage(
      conversationId,
      renterId,
      '  Olá!\r\nTudo bem?  ',
    );

    expect(repository.createMessage).toHaveBeenCalledWith(
      conversationId,
      renterId,
      'Olá!\nTudo bem?',
    );
  });

  it('rejects empty messages and inaccessible conversations', async () => {
    await expect(
      service.sendMessage(conversationId, renterId, '   '),
    ).rejects.toBeInstanceOf(BadRequestException);

    repository.findConversationAccess.mockResolvedValue(null);
    await expect(
      service.sendMessage(conversationId, renterId, 'Olá'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks only an accessible conversation as read', async () => {
    await service.markAsRead(conversationId, renterId);

    expect(repository.markAsRead).toHaveBeenCalledWith(
      conversationId,
      renterId,
    );
  });
});

function accessFixture(withConversation = true): ConversationAccess {
  return {
    booking: {
      id: bookingId,
      pickupDate: '2026-09-10',
      returnDate: '2026-09-13',
      status: 'confirmed',
      vehicle: {
        id: '66666666-6666-4666-8666-666666666666',
        make: 'Jeep',
        model: 'Compass',
      },
    },
    conversationCreatedAt: withConversation ? new Date() : undefined,
    conversationId: withConversation ? conversationId : undefined,
    conversationUpdatedAt: withConversation ? new Date() : undefined,
    hostId,
    renterId,
  };
}

function summaryFixture(): ConversationSummary {
  return {
    booking: accessFixture().booking,
    createdAt: '2026-08-27T14:00:00.000Z',
    id: conversationId,
    lastMessage: null,
    otherParticipant: {
      avatarUrl: null,
      id: hostId,
      name: 'Anfitrião QA',
    },
    unreadCount: 0,
    updatedAt: '2026-08-27T14:00:00.000Z',
  };
}
