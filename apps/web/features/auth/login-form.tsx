'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useAuth } from './auth-provider';
import { GoogleAuthButton } from './google-auth-button';

export function LoginForm({
  oauthFailed = false,
  redirectTo = '/',
}: {
  oauthFailed?: boolean;
  redirectTo?: string;
}) {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(
    oauthFailed ? 'Não foi possível entrar com Google. Tente novamente.' : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      await login({
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
      });
      router.push(redirectTo);
      router.refresh();
    } catch (caughtError) {
      setError(toMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold">Entrar na Riddy</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Acesse sua conta para continuar sua jornada.
      </p>

      {error ? (
        <Alert className="mt-5" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Field label="E-mail" name="email" type="email" />
        <Field
          autoComplete="current-password"
          label="Senha"
          name="password"
          type="password"
        />

        <div className="flex justify-end">
          <Link
            className="font-heading text-sm font-medium text-primary-strong hover:underline"
            href="/recuperar-senha"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button className="w-full" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          ) : null}
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <Divider />
      <GoogleAuthButton />

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link
          className="font-heading font-medium text-primary-strong hover:underline"
          href="/cadastro"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}

function Field({
  autoComplete,
  label,
  name,
  type,
}: {
  autoComplete?: string;
  label: string;
  name: string;
  type: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block font-heading text-sm font-medium"
        htmlFor={`login-${name}`}
      >
        {label}
      </label>
      <Input
        autoComplete={autoComplete ?? name}
        id={`login-${name}`}
        name={name}
        required
        type={type}
      />
    </div>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      ou
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function toMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível entrar. Tente novamente.';
}
