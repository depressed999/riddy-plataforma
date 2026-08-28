import type { Metadata } from 'next';

import { AuthShell } from '@/features/auth/auth-shell';
import { RecoveryForm } from '@/features/auth/recovery-form';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Recuperar senha | Riddy',
};

export default function RecoveryPage() {
  return (
    <AuthShell
      description="O link de recuperação é temporário e só pode ser utilizado uma vez."
      eyebrow="Acesso seguro"
      title="Vamos recuperar seu acesso."
    >
      <RecoveryForm />
    </AuthShell>
  );
}
