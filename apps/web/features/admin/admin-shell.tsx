'use client';

import {
  Banknote,
  CarFront,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  ShieldAlert,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import { RiddyLogo } from '@/components/layout/riddy-logo';
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

const navigation = [
  { href: '/admin', icon: LayoutDashboard, label: 'Visão geral' },
  { href: '/admin/usuarios', icon: UsersRound, label: 'Usuários' },
  { href: '/admin/veiculos', icon: CarFront, label: 'Veículos' },
  { href: '/admin/reservas', icon: ClipboardList, label: 'Reservas' },
  { href: '/admin/pagamentos', icon: Banknote, label: 'Pagamentos' },
  { href: '/admin/kyc', icon: ClipboardCheck, label: 'KYC' },
  { href: '/admin/auditoria', icon: FileClock, label: 'Auditoria' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { isLoading, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2
          aria-label="Verificando acesso"
          className="animate-spin text-primary-strong"
          size={32}
        />
      </div>
    );
  if (!user || user.role !== 'admin')
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto text-warning" size={34} />
          <h1 className="mt-4 font-heading text-2xl font-semibold">
            Acesso administrativo necessário
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Entre com uma conta administradora para acessar este backoffice.
          </p>
          <Button asChild className="mt-6">
            <Link href="/entrar?next=/admin">Ir para o login</Link>
          </Button>
        </div>
      </div>
    );

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/');
    } finally {
      setLoggingOut(false);
    }
  }
  const nav = (close = false) => (
    <>
      <nav aria-label="Administração" className="grid gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
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
              onClick={close ? () => setMenuOpen(false) : undefined}
            >
              <Icon aria-hidden="true" size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border pt-5">
        <p className="truncate font-heading text-sm font-semibold">
          {user.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <Button
          className="mt-3 w-full"
          disabled={loggingOut}
          onClick={() => void handleLogout()}
          variant="secondary"
        >
          <LogOut size={17} />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-card p-5 lg:flex">
        <RiddyLogo />
        <p className="mt-7 mb-4 font-heading text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Backoffice administrativo
        </p>
        {nav()}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <RiddyLogo />
          <Sheet onOpenChange={setMenuOpen} open={menuOpen}>
            <SheetTrigger asChild>
              <Button
                aria-label="Abrir menu administrativo"
                size="icon"
                variant="secondary"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col" side="left">
              <SheetHeader>
                <SheetTitle>Administração</SheetTitle>
                <SheetDescription>
                  Operação e segurança da plataforma.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-7 flex flex-1 flex-col">{nav(true)}</div>
            </SheetContent>
          </Sheet>
        </header>
        <main id="conteudo-admin">{children}</main>
      </div>
    </div>
  );
}
