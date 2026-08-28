import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { sessionCookieName } from '../auth/auth.constants';
import { CurrentUser } from '../auth/auth.decorators';
import type { PublicUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TrustedOriginGuard } from '../auth/trusted-origin.guard';
import { SendMessageDto, StartConversationDto } from './messages.dto';
import { MessagesService } from './messages.service';
import type {
  ConversationMessage,
  ConversationSummary,
  ConversationThread,
} from './messages.types';

@ApiTags('messages')
@ApiCookieAuth(sessionCookieName)
@Controller('messages')
@UseGuards(SessionAuthGuard)
export class MessagesController {
  constructor(
    @Inject(MessagesService)
    private readonly messagesService: MessagesService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Lista as conversas do usuário autenticado' })
  @ApiOkResponse({ isArray: true })
  listConversations(
    @CurrentUser() user: PublicUser,
  ): Promise<ConversationSummary[]> {
    return this.messagesService.listConversations(user.id);
  }

  @Post('conversations')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Inicia ou recupera a conversa de uma reserva' })
  @ApiBody({ type: StartConversationDto })
  @ApiCreatedResponse()
  startConversation(
    @CurrentUser() user: PublicUser,
    @Body() input: StartConversationDto,
  ): Promise<ConversationSummary> {
    return this.messagesService.startConversation(input.bookingId, user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Carrega uma conversa e suas mensagens recentes' })
  @ApiOkResponse()
  getThread(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ConversationThread> {
    return this.messagesService.getThread(id, user.id);
  }

  @Post('conversations/:id/messages')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Envia uma mensagem de texto na conversa' })
  @ApiBody({ type: SendMessageDto })
  @ApiCreatedResponse()
  sendMessage(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: SendMessageDto,
  ): Promise<ConversationMessage> {
    return this.messagesService.sendMessage(id, user.id, input.body);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Marca como lidas as mensagens recebidas' })
  @ApiNoContentResponse()
  markAsRead(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.messagesService.markAsRead(id, user.id);
  }
}
