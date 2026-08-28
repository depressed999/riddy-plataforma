import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Entrar | Riddy',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectTo = normalizeRedirect(params.next);

  return (
    <AuthShell
      description="Entre com segurança para acompanhar suas próximas experiências na plataforma."
      eyebrow="Sua conta"
      title="Bem-vindo de volta."
    >
      <LoginForm
        oauthFailed={params.oauth === 'failed'}
        redirectTo={redirectTo}
      />
    </AuthShell>
  );
}

function normalizeRedirect(value: string | string[] | undefined): string {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : '/';
}
