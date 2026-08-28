import type { Metadata } from 'next';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AuthShell } from '@/features/auth/auth-shell';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Redefinir senha | Riddy',
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  return (
    <AuthShell
      description="Escolha uma senha forte. Todas as sessões anteriores serão encerradas após a alteração."
      eyebrow="Proteção da conta"
      title="Crie uma nova senha."
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert variant="warning">
          <AlertTitle>Link incompleto</AlertTitle>
          <AlertDescription>
            Solicite um novo link na página de{' '}
            <Link className="font-medium underline" href="/recuperar-senha">
              recuperação de senha
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}
    </AuthShell>
  );
}
