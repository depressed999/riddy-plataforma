import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminShell } from '@/features/admin/admin-shell';
import { AuthProvider } from '@/features/auth/auth-provider';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
