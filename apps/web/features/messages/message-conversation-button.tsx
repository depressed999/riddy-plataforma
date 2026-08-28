'use client';

import { Loader2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { startConversation } from './messages.service';

export function MessageConversationButton({
  bookingId,
  label = 'Enviar mensagem',
}: {
  bookingId: string;
  label?: string;
}) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState('');

  async function handleOpen(): Promise<void> {
    setIsOpening(true);
    setError('');
    try {
      const conversation = await startConversation(bookingId);
      router.push(`/mensagens/${conversation.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível abrir a conversa.',
      );
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="grid gap-1">
      <Button
        disabled={isOpening}
        onClick={() => void handleOpen()}
        size="sm"
        variant="secondary"
      >
        {isOpening ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={16} />
        ) : (
          <MessageCircle aria-hidden="true" size={16} />
        )}
        {isOpening ? 'Abrindo...' : label}
      </Button>
      {error ? (
        <span className="max-w-56 text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
