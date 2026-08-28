'use client';

import {
  CalendarRange,
  CarFront,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import { RiddyLogo } from '@/components/layout/riddy-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/auth-provider';
import { cn } from '@/lib/utils';

import { useHost } from './host-provider';

const navigation = [
  { href: '/anfitriao', icon: LayoutDashboard, label: 'Visão geral' },
  { href: '/anfitriao/veiculos', icon: CarFront, label: 'Veículos' },
  { href: '/anfitriao/reservas', icon: ClipboardList, label: 'Reservas' },
  { href: '/mensagens', icon: MessageCircle, label: 'Mensagens' },
  { href: '/anfitriao/calendario', icon: CalendarRange, label: 'Calendário' },
  {
    href: '/anfitriao/financeiro',
    icon: CircleDollarSign,
    label: 'Financeiro',
  },
  { href: '/anfitriao/configuracoes', icon: Settings, label: 'Configurações' },
];

export function HostShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dashboard } = useHost();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/');
    } finally {
      setIsLoggingOut(false);
    }
  }

  function navigationContent(closeOnNavigate = false): ReactNode {
    return (
      <>
        <nav aria-label="Área do anfitrião" className="grid gap-1">
          {navigation.map((item) => {
            const active =
              item.href === '/anfitriao'
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-md px-3 font-heading text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                href={item.href}
                key={item.href}
                onClick={
                  closeOnNavigate ? () => setIsMenuOpen(false) : undefined
                }
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-border pt-5">
          <p className="truncate font-heading text-sm font-semibold">
            {dashboard?.profile?.displayName ?? user?.name ?? 'Sua conta'}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <Badge
              variant={
                dashboard?.profile?.status === 'active' ? 'success' : 'warning'
              }
            >
              {dashboard?.profile?.status === 'active'
                ? 'Anfitrião ativo'
                : 'Configuração pendente'}
            </Badge>
            <Button
              aria-label="Sair da conta"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
              size="icon"
              variant="ghost"
            >
              {isLoggingOut ? (
                <Loader2
                  aria-hidden="true"
                  className="animate-spin"
                  size={17}
                />
              ) : (
                <LogOut aria-hidden="true" size={17} />
              )}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <a
        className="sr-only z-[70] rounded-md bg-card px-4 py-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        href="#conteudo-anfitriao"
      >
        Ir para o conteúdo
      </a>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-card p-5 lg:flex">
        <RiddyLogo />
        <p className="mt-7 mb-4 font-heading text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Painel do anfitrião
        </p>
        {navigationContent()}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <RiddyLogo />
          <Sheet onOpenChange={setIsMenuOpen} open={isMenuOpen}>
            <SheetTrigger asChild>
              <Button aria-label="Abrir menu" size="icon" variant="secondary">
                <Menu aria-hidden="true" size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col" side="left">
              <SheetHeader>
                <SheetTitle>Área do anfitrião</SheetTitle>
                <SheetDescription>
                  Gerencie veículos, agenda e resultados.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-7 flex flex-1 flex-col">
                {navigationContent(true)}
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main id="conteudo-anfitriao">{children}</main>
      </div>
    </div>
  );
}
