'use client';

import {
  ArrowLeft,
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Container } from '@/components/layout/container';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/auth-provider';
import { cn } from '@/lib/utils';

import {
  getConversation,
  listConversations,
  markConversationRead,
  MessagesUnauthorizedError,
  sendMessage,
} from './messages.service';
import type {
  ConversationMessage,
  ConversationSummary,
  ConversationThread,
} from './messages.types';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
});
const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});
const periodFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function MessagesPageContent({
  initialConversationId,
}: {
  initialConversationId?: string;
}) {
  const router = useRouter();
  const { isLoading: isSessionLoading, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [isInboxLoading, setIsInboxLoading] = useState(true);
  const [isThreadLoading, setIsThreadLoading] = useState(
    Boolean(initialConversationId),
  );
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const returnPath = initialConversationId
    ? `/mensagens/${initialConversationId}`
    : '/mensagens';

  const handleUnauthorized = useCallback(() => {
    router.replace(`/entrar?next=${encodeURIComponent(returnPath)}`);
  }, [returnPath, router]);

  const loadInbox = useCallback(
    async (silent = false): Promise<void> => {
      if (!silent) setIsInboxLoading(true);
      try {
        const response = await listConversations();
        setConversations(response);
        setError('');
      } catch (caughtError) {
        if (caughtError instanceof MessagesUnauthorizedError) {
          handleUnauthorized();
          return;
        }
        if (!silent) setError(messageFrom(caughtError));
      } finally {
        if (!silent) setIsInboxLoading(false);
      }
    },
    [handleUnauthorized],
  );

  const loadThread = useCallback(
    async (silent = false): Promise<void> => {
      if (!initialConversationId) {
        setThread(null);
        setIsThreadLoading(false);
        return;
      }
      if (!silent) setIsThreadLoading(true);
      try {
        const response = await getConversation(initialConversationId);
        const unread = response.conversation.unreadCount;
        setThread({
          ...response,
          conversation: { ...response.conversation, unreadCount: 0 },
        });
        if (unread > 0) {
          await markConversationRead(initialConversationId);
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === initialConversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            ),
          );
        }
        setError('');
      } catch (caughtError) {
        if (caughtError instanceof MessagesUnauthorizedError) {
          handleUnauthorized();
          return;
        }
        if (!silent) setError(messageFrom(caughtError));
      } finally {
        if (!silent) setIsThreadLoading(false);
      }
    },
    [handleUnauthorized, initialConversationId],
  );

  useEffect(() => {
    if (isSessionLoading) return;
    if (!user) {
      handleUnauthorized();
      return;
    }
    const initialLoad = window.setTimeout(() => void loadInbox(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadInbox(true);
    }, 8_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [handleUnauthorized, isSessionLoading, loadInbox, user]);

  useEffect(() => {
    if (isSessionLoading || !user || !initialConversationId) return;
    const initialLoad = window.setTimeout(() => void loadThread(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadThread(true);
    }, 5_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [initialConversationId, isSessionLoading, loadThread, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!initialConversationId || !body.trim() || isSending) return;
    setIsSending(true);
    setError('');
    try {
      const created = await sendMessage(initialConversationId, body);
      setThread((current) =>
        current
          ? {
              ...current,
              messages: appendUnique(current.messages, created),
            }
          : current,
      );
      setBody('');
      await loadInbox(true);
    } catch (caughtError) {
      if (caughtError instanceof MessagesUnauthorizedError) {
        handleUnauthorized();
        return;
      }
      setError(messageFrom(caughtError));
    } finally {
      setIsSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <PageHeader
        actions={
          <Button
            aria-label="Atualizar conversas"
            onClick={() => {
              void loadInbox();
              if (initialConversationId) void loadThread();
            }}
            size="icon"
            variant="secondary"
          >
            <RefreshCw aria-hidden="true" size={18} />
          </Button>
        }
        description="Combine detalhes da retirada e mantenha o histórico de cada reserva em um só lugar."
        eyebrow="Comunicação da reserva"
        title="Mensagens"
      />

      {error ? (
        <Alert className="mt-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-8 min-h-[620px] overflow-hidden rounded-xl border border-border bg-card lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside
          aria-label="Conversas"
          className={cn(
            'min-h-[620px] flex-col border-border lg:flex lg:border-r',
            initialConversationId ? 'hidden' : 'flex',
          )}
        >
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-heading text-lg font-semibold">Conversas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Atualização automática enquanto esta página estiver aberta.
            </p>
          </div>
          {isInboxLoading || isSessionLoading ? (
            <div className="grid gap-3 p-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              className="m-4 flex-1"
              description="Abra uma conversa a partir de uma reserva enviada ou recebida."
              icon={Inbox}
              title="Nenhuma conversa"
            />
          ) : (
            <nav aria-label="Lista de conversas" className="grid">
              {conversations.map((conversation) => (
                <ConversationLink
                  active={conversation.id === initialConversationId}
                  conversation={conversation}
                  key={conversation.id}
                />
              ))}
            </nav>
          )}
        </aside>

        <section
          aria-label="Conversa selecionada"
          className={cn(
            'min-h-[620px] min-w-0 flex-col',
            initialConversationId ? 'flex' : 'hidden lg:flex',
          )}
        >
          {!initialConversationId ? (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary-strong">
                  <MessageCircle aria-hidden="true" size={26} />
                </span>
                <h2 className="mt-5 font-heading text-xl font-semibold">
                  Selecione uma conversa
                </h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  As mensagens ficam vinculadas à reserva e visíveis apenas aos
                  dois participantes.
                </p>
              </div>
            </div>
          ) : isThreadLoading ? (
            <div className="grid flex-1 gap-4 p-6">
              <Skeleton className="h-20" />
              <Skeleton className="h-64" />
              <Skeleton className="h-28" />
            </div>
          ) : !thread ? (
            <EmptyState
              className="m-6 flex-1"
              description="Esta conversa não existe ou não pertence à sua conta."
              icon={MessageCircle}
              title="Conversa indisponível"
            />
          ) : (
            <>
              <ConversationHeader conversation={thread.conversation} />
              <div
                aria-live="polite"
                className="flex flex-1 flex-col gap-3 overflow-y-auto bg-muted/35 p-4 sm:p-6"
              >
                {thread.messages.length === 0 ? (
                  <div className="my-auto text-center">
                    <p className="font-heading font-semibold">
                      Inicie a conversa
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Evite compartilhar senhas, documentos ou dados de cartão.
                    </p>
                  </div>
                ) : (
                  thread.messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form
                className="border-t border-border p-4 sm:p-5"
                onSubmit={handleSubmit}
              >
                <label className="sr-only" htmlFor="message-body">
                  Escreva uma mensagem
                </label>
                <Textarea
                  className="min-h-20 resize-none"
                  id="message-body"
                  maxLength={2000}
                  onChange={(event) => setBody(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Escreva uma mensagem..."
                  required
                  value={body}
                />
                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    {body.length}/2000 · Ctrl + Enter para enviar
                  </p>
                  <Button disabled={isSending || !body.trim()} type="submit">
                    {isSending ? (
                      <Loader2
                        aria-hidden="true"
                        className="animate-spin"
                        size={17}
                      />
                    ) : (
                      <Send aria-hidden="true" size={17} />
                    )}
                    {isSending ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </Container>
  );
}

function ConversationLink({
  active,
  conversation,
}: {
  active: boolean;
  conversation: ConversationSummary;
}) {
  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className={cn(
        'grid grid-cols-[42px_minmax(0,1fr)] gap-3 border-b border-border px-4 py-4 transition-colors hover:bg-muted/70',
        active && 'bg-primary-soft',
      )}
      href={`/mensagens/${conversation.id}`}
    >
      <ParticipantAvatar name={conversation.otherParticipant.name} />
      <span className="min-w-0">
        <span className="flex items-start justify-between gap-3">
          <span className="truncate font-heading text-sm font-semibold">
            {conversation.otherParticipant.name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatShortDate(
              conversation.lastMessage?.createdAt ?? conversation.createdAt,
            )}
          </span>
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {conversation.booking.vehicle.make}{' '}
          {conversation.booking.vehicle.model}
        </span>
        <span className="mt-2 flex items-center justify-between gap-3">
          <span className="truncate text-sm text-muted-foreground">
            {conversation.lastMessage?.body ?? 'Conversa iniciada'}
          </span>
          {conversation.unreadCount > 0 ? (
            <Badge variant="primary">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Badge>
          ) : null}
        </span>
      </span>
    </Link>
  );
}

function ConversationHeader({
  conversation,
}: {
  conversation: ConversationSummary;
}) {
  return (
    <header className="border-b border-border px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button asChild className="lg:hidden" size="icon" variant="ghost">
          <Link aria-label="Voltar para conversas" href="/mensagens">
            <ArrowLeft aria-hidden="true" size={19} />
          </Link>
        </Button>
        <ParticipantAvatar name={conversation.otherParticipant.name} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading font-semibold">
            {conversation.otherParticipant.name}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {conversation.booking.vehicle.make}{' '}
            {conversation.booking.vehicle.model} ·{' '}
            {formatPeriod(conversation.booking.pickupDate)} a{' '}
            {formatPeriod(conversation.booking.returnDate)}
          </p>
        </div>
        <span
          className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
          title="Acesso restrito aos participantes da reserva"
        >
          <ShieldCheck aria-hidden="true" size={16} />
          Conversa protegida
        </span>
      </div>
    </header>
  );
}

function ParticipantAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft font-heading text-sm font-semibold text-primary-strong"
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  return (
    <article
      className={cn(
        'max-w-[85%] rounded-xl px-4 py-3 shadow-sm sm:max-w-[72%]',
        message.isMine
          ? 'ml-auto rounded-br-sm bg-primary text-primary-foreground'
          : 'mr-auto rounded-bl-sm border border-border bg-card',
      )}
    >
      <p className="whitespace-pre-wrap break-words text-sm leading-6">
        {message.body}
      </p>
      <p
        className={cn(
          'mt-1.5 text-right text-[11px]',
          message.isMine
            ? 'text-primary-foreground/75'
            : 'text-muted-foreground',
        )}
      >
        {timeFormatter.format(new Date(message.createdAt))}
        {message.isMine && message.readAt ? ' · Lida' : ''}
      </p>
    </article>
  );
}

function appendUnique(
  messages: ConversationMessage[],
  created: ConversationMessage,
): ConversationMessage[] {
  return messages.some((message) => message.id === created.id)
    ? messages
    : [...messages, created];
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? timeFormatter.format(date)
    : dateFormatter.format(date);
}

function formatPeriod(value: string): string {
  return periodFormatter.format(new Date(`${value}T12:00:00`));
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível carregar as mensagens.';
}
