import type { ReactNode } from 'react';

import { PublicFooter } from '@/components/layout/public-footer';
import { PublicHeader } from '@/components/layout/public-header';
import { AuthProvider } from '@/features/auth/auth-provider';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <a
          className="sr-only z-[60] rounded-md bg-card px-4 py-3 font-heading text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2 focus:ring-ring"
          href="#conteudo-principal"
        >
          Ir para o conteúdo principal
        </a>
        <PublicHeader />
        <main className="flex-1" id="conteudo-principal">
          {children}
        </main>
        <PublicFooter />
      </div>
    </AuthProvider>
  );
}
