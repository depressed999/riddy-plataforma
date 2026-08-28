import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { RegisterForm } from '@/features/auth/register-form';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Criar conta | Riddy',
};

export default function RegisterPage() {
  return (
    <AuthShell
      description="Uma conta conecta locatários e proprietários com uma experiência simples e transparente."
      eyebrow="Comece agora"
      title="Mobilidade feita entre pessoas."
    >
      <RegisterForm />
    </AuthShell>
  );
}
