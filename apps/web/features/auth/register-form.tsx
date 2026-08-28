'use client';

import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useAuth } from './auth-provider';
import { GoogleAuthButton } from './google-auth-button';

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmation = String(formData.get('confirmation') ?? '');

    if (password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: String(formData.get('email') ?? ''),
        name: String(formData.get('name') ?? ''),
        password,
      });
      router.push('/');
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível criar sua conta.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold">Criar sua conta</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Comece com os dados essenciais. Seu perfil completo virá na próxima
        etapa.
      </p>

      {error ? (
        <Alert className="mt-5" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Field autoComplete="name" label="Nome" name="name" type="text" />
        <Field autoComplete="email" label="E-mail" name="email" type="email" />
        <Field
          autoComplete="new-password"
          label="Senha"
          name="password"
          pattern="(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}"
          type="password"
        />
        <Field
          autoComplete="new-password"
          label="Confirmar senha"
          name="confirmation"
          type="password"
        />

        <ul className="grid gap-1.5 text-xs leading-5 text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check
              aria-hidden="true"
              className="text-primary-strong"
              size={15}
            />
            Pelo menos 8 caracteres
          </li>
          <li className="flex items-center gap-2">
            <Check
              aria-hidden="true"
              className="text-primary-strong"
              size={15}
            />
            Uma letra, um número e um símbolo
          </li>
        </ul>

        <Button className="w-full" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          ) : null}
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleAuthButton />

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Já possui conta?{' '}
        <Link
          className="font-heading font-medium text-primary-strong hover:underline"
          href="/entrar"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

function Field({
  autoComplete,
  label,
  name,
  pattern,
  type,
}: {
  autoComplete: string;
  label: string;
  name: string;
  pattern?: string;
  type: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block font-heading text-sm font-medium"
        htmlFor={`register-${name}`}
      >
        {label}
      </label>
      <Input
        autoComplete={autoComplete}
        id={`register-${name}`}
        minLength={name === 'password' ? 8 : undefined}
        name={name}
        pattern={pattern}
        required
        type={type}
      />
    </div>
  );
}
