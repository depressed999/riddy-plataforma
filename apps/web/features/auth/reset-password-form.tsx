'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { confirmPasswordRecovery } from './auth.service';

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSuccess('');
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmation = String(formData.get('confirmation') ?? '');

    if (password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await confirmPasswordRecovery({ password, token });
      setSuccess(response.message);
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível redefinir a senha.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold">
        Definir nova senha
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Crie uma senha diferente da anterior e mantenha sua conta protegida.
      </p>

      {error ? (
        <Alert className="mt-5" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="mt-5" variant="success">
          <AlertTitle>Senha atualizada</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <PasswordField label="Nova senha" name="password" />
        <PasswordField label="Confirmar nova senha" name="confirmation" />
        <Button
          className="w-full"
          disabled={isSubmitting || Boolean(success)}
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          ) : null}
          {isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm">
        <Link
          className="font-heading font-medium text-primary-strong hover:underline"
          href="/entrar"
        >
          Ir para o login
        </Link>
      </p>
    </div>
  );
}

function PasswordField({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label
        className="mb-1.5 block font-heading text-sm font-medium"
        htmlFor={`reset-${name}`}
      >
        {label}
      </label>
      <Input
        autoComplete="new-password"
        id={`reset-${name}`}
        minLength={8}
        name={name}
        pattern="(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}"
        required
        type="password"
      />
    </div>
  );
}
