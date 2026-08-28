import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MessagesRepository } from './messages.repository';
import type {
  ConversationAccess,
  ConversationMessage,
  ConversationSummary,
  ConversationThread,
} from './messages.types';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(MessagesRepository)
    private readonly repository: MessagesRepository,
  ) {}

  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const accesses = await this.repository.listConversationAccesses(userId);
    return Promise.all(
      accesses.map((access) => this.summaryFromAccess(access, userId)),
    );
  }

  async startConversation(
    bookingId: string,
    userId: string,
  ): Promise<ConversationSummary> {
    const bookingAccess = await this.repository.findBookingAccess(
      bookingId,
      userId,
    );
    if (!bookingAccess) {
      throw new NotFoundException('Reserva não encontrada.');
    }
    const otherParticipant = await this.repository.findParticipant(
      this.otherParticipantId(bookingAccess, userId),
    );
    if (!otherParticipant) {
      throw new ConflictException(
        'O outro participante ainda não possui uma conta disponível para mensagens.',
      );
    }
    const conversationId = await this.repository.createConversation(bookingId);
    const conversationAccess = await this.repository.findConversationAccess(
      conversationId,
      userId,
    );
    if (!conversationAccess) {
      throw new Error('A conversa criada não pôde ser carregada.');
    }
    return this.summaryFromAccess(conversationAccess, userId, otherParticipant);
  }

  async getThread(
    conversationId: string,
    userId: string,
  ): Promise<ConversationThread> {
    const access = await this.requireAccess(conversationId, userId);
    const [conversation, messages] = await Promise.all([
      this.summaryFromAccess(access, userId),
      this.repository.listMessages(conversationId, userId),
    ]);
    return { conversation, messages };
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    rawBody: string,
  ): Promise<ConversationMessage> {
    await this.requireAccess(conversationId, userId);
    const body = normalizeBody(rawBody);
    if (!body) {
      throw new BadRequestException('Escreva uma mensagem antes de enviar.');
    }
    return this.repository.createMessage(conversationId, userId, body);
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.requireAccess(conversationId, userId);
    await this.repository.markAsRead(conversationId, userId);
  }

  private async requireAccess(
    conversationId: string,
    userId: string,
  ): Promise<ConversationAccess> {
    const access = await this.repository.findConversationAccess(
      conversationId,
      userId,
    );
    if (!access) {
      throw new NotFoundException('Conversa não encontrada.');
    }
    return access;
  }

  private async summaryFromAccess(
    access: ConversationAccess,
    userId: string,
    knownParticipant?: Awaited<
      ReturnType<MessagesRepository['findParticipant']>
    >,
  ): Promise<ConversationSummary> {
    if (!access.conversationId) {
      throw new Error('A conversa não possui identificador.');
    }
    const otherParticipant =
      knownParticipant ??
      (await this.repository.findParticipant(
        this.otherParticipantId(access, userId),
      ));
    if (!otherParticipant) {
      throw new NotFoundException('Participante da conversa não encontrado.');
    }
    const summaryData = await this.repository.getSummaryData(
      access.conversationId,
      userId,
    );
    return this.repository.toSummary(access, otherParticipant, summaryData);
  }

  private otherParticipantId(
    access: ConversationAccess,
    userId: string,
  ): string {
    return access.renterId === userId ? access.hostId : access.renterId;
  }
}

function normalizeBody(body: string): string {
  return body.replace(/\r\n/g, '\n').trim();
}
