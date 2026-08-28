'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { requestPasswordRecovery } from './auth.service';

export function RecoveryForm() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [developmentToken, setDevelopmentToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setDevelopmentToken('');
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await requestPasswordRecovery(
        String(formData.get('email') ?? ''),
      );
      setMessage(response.message);
      setDevelopmentToken(response.developmentResetToken ?? '');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível solicitar a recuperação.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold">Recuperar senha</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Informe seu e-mail para receber um link temporário de redefinição.
      </p>

      {error ? (
        <Alert className="mt-5" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert className="mt-5" variant="success">
          <AlertTitle>Solicitação recebida</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
          {developmentToken ? (
            <Link
              className="mt-3 inline-flex font-heading font-medium underline"
              href={`/redefinir-senha?token=${encodeURIComponent(developmentToken)}`}
            >
              Abrir link local de desenvolvimento
            </Link>
          ) : null}
        </Alert>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block font-heading text-sm font-medium"
            htmlFor="recovery-email"
          >
            E-mail
          </label>
          <Input
            autoComplete="email"
            id="recovery-email"
            name="email"
            required
            type="email"
          />
        </div>
        <Button className="w-full" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          ) : null}
          {isSubmitting ? 'Enviando...' : 'Enviar instruções'}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm">
        <Link
          className="font-heading font-medium text-primary-strong hover:underline"
          href="/entrar"
        >
          Voltar para entrar
        </Link>
      </p>
    </div>
  );
}
