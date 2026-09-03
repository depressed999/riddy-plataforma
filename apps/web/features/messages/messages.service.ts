import type {
  ConversationMessage,
  ConversationSummary,
  ConversationThread,
} from './messages.types';

export class MessagesUnauthorizedError extends Error {}

export function listConversations(): Promise<ConversationSummary[]> {
  return messagesRequest<ConversationSummary[]>(
    '/api/v1/messages/conversations',
  );
}

export function startConversation(
  bookingId: string,
): Promise<ConversationSummary> {
  return messagesRequest<ConversationSummary>(
    '/api/v1/messages/conversations',
    {
      body: JSON.stringify({ bookingId }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );
}

export function getConversation(
  conversationId: string,
): Promise<ConversationThread> {
  return messagesRequest<ConversationThread>(
    `/api/v1/messages/conversations/${conversationId}`,
  );
}

export function sendMessage(
  conversationId: string,
  body: string,
): Promise<ConversationMessage> {
  return messagesRequest<ConversationMessage>(
    `/api/v1/messages/conversations/${conversationId}/messages`,
    {
      body: JSON.stringify({ body }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  await messagesRequest<void>(
    `/api/v1/messages/conversations/${conversationId}/read`,
    { method: 'POST' },
  );
}

async function messagesRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (response.status === 401) {
    throw new MessagesUnauthorizedError(
      'Sua sessão expirou. Entre novamente para continuar.',
    );
  }
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(' ')
          : typeof payload.message === 'string'
            ? payload.message
            : undefined
        : undefined;
    throw new Error(message || 'Não foi possível concluir a operação.');
  }
  return payload as T;
}
