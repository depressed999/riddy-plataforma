import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/auth-provider';
import { HostProvider } from '@/features/hosts/host-provider';
import { HostShell } from '@/features/hosts/host-shell';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default function HostLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <HostProvider>
        <HostShell>{children}</HostShell>
      </HostProvider>
    </AuthProvider>
  );
}
