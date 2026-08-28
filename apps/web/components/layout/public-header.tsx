'use client';

import {
  CalendarDays,
  CarFront,
  ClipboardCheck,
  ShieldCheck,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Container } from '@/components/layout/container';
import { RiddyLogo } from '@/components/layout/riddy-logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/auth-provider';

const navigation = [
  { href: '/buscar', label: 'Alugar' },
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#proprietarios', label: 'Para proprietários' },
];

export function PublicHeader() {
  const { isLoading, logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      return;
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <Container className="flex min-h-18 items-center justify-between gap-6">
        <RiddyLogo />

        <nav
          aria-label="Navegação principal"
          className="hidden items-stretch self-stretch lg:flex"
        >
          {navigation.map((item, index) => (
            <Link
              className="relative flex items-center px-5 font-heading text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              href={item.href}
              key={item.href}
            >
              {item.label}
              {index === 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-5 bottom-0 h-0.5 bg-primary-strong"
                />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden min-w-52 items-center justify-end gap-3 lg:flex">
          {isLoading ? (
            <div
              aria-label="Verificando sessão"
              className="h-10 w-40 animate-pulse rounded-md bg-muted"
            />
          ) : user ? (
            <>
              <Link
                className="flex items-center gap-2 rounded-md px-2 py-2 font-heading text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/anfitriao"
              >
                <CarFront aria-hidden="true" size={18} />
                Anfitrião
              </Link>
              {user.role !== 'user' ? (
                <Link
                  className="flex items-center gap-2 rounded-md px-2 py-2 font-heading text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/verificacoes/kyc"
                >
                  <ClipboardCheck aria-hidden="true" size={18} />
                  Análises
                </Link>
              ) : null}
              {user.role === 'admin' ? (
                <Link
                  className="flex items-center gap-2 rounded-md px-2 py-2 font-heading text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/admin"
                >
                  <ShieldCheck aria-hidden="true" size={18} />
                  Admin
                </Link>
              ) : null}
              <Link
                className="flex items-center gap-2 rounded-md px-2 py-2 font-heading text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/reservas"
              >
                <CalendarDays aria-hidden="true" size={18} />
                Reservas
              </Link>
              <Link
                className="flex items-center gap-2 rounded-md px-2 py-2 font-heading text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/mensagens"
              >
                <MessageCircle aria-hidden="true" size={18} />
                Mensagens
              </Link>
              <Link
                className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 font-heading text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/perfil"
              >
                <UserRound aria-hidden="true" size={18} />
                <span className="max-w-32 truncate">
                  {firstName(user.name)}
                </span>
              </Link>
              <Button
                aria-label="Sair da conta"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                size="icon"
                variant="secondary"
              >
                {isLoggingOut ? (
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <LogOut aria-hidden="true" size={18} />
                )}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="secondary">
                <Link href="/entrar">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              aria-label="Abrir menu de navegação"
              className="lg:hidden"
              size="icon"
              variant="secondary"
            >
              <Menu aria-hidden="true" size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col" side="right">
            <SheetHeader>
              <SheetTitle>Navegação</SheetTitle>
              <SheetDescription>
                Encontre veículos ou conheça a Riddy.
              </SheetDescription>
            </SheetHeader>

            <nav aria-label="Navegação móvel" className="mt-8 grid gap-1">
              {navigation.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    className="flex min-h-12 items-center rounded-md px-3 font-heading text-base font-medium text-foreground transition-colors hover:bg-muted"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>

            <div className="mt-auto grid gap-3 border-t border-border pt-6">
              {user ? (
                <>
                  <SheetClose asChild>
                    <Link
                      className="flex min-h-12 items-center gap-2 rounded-md px-3 font-heading text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      href="/mensagens"
                    >
                      <MessageCircle aria-hidden="true" size={18} />
                      Mensagens
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      className="flex min-h-12 items-center gap-2 rounded-md px-3 font-heading text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      href="/anfitriao"
                    >
                      <CarFront aria-hidden="true" size={18} />
                      Área do anfitrião
                    </Link>
                  </SheetClose>
                  {user.role !== 'user' ? (
                    <SheetClose asChild>
                      <Link
                        className="flex min-h-12 items-center gap-2 rounded-md px-3 font-heading text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        href="/verificacoes/kyc"
                      >
                        <ClipboardCheck aria-hidden="true" size={18} />
                        Análises KYC
                      </Link>
                    </SheetClose>
                  ) : null}
                  {user.role === 'admin' ? (
                    <SheetClose asChild>
                      <Link
                        className="flex min-h-12 items-center gap-2 rounded-md px-3 font-heading text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        href="/admin"
                      >
                        <ShieldCheck aria-hidden="true" size={18} />
                        Administração
                      </Link>
                    </SheetClose>
                  ) : null}
                  <SheetClose asChild>
                    <Link
                      className="flex min-h-12 items-center gap-2 rounded-md px-3 font-heading text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      href="/reservas"
                    >
                      <CalendarDays aria-hidden="true" size={18} />
                      Minhas reservas
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      className="flex min-h-12 items-center gap-2 rounded-md px-3 font-heading text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      href="/perfil"
                    >
                      <UserRound aria-hidden="true" size={18} />
                      <span className="truncate">{user.name}</span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      disabled={isLoggingOut}
                      onClick={() => void handleLogout()}
                      variant="secondary"
                    >
                      <LogOut aria-hidden="true" size={18} />
                      Sair
                    </Button>
                  </SheetClose>
                </>
              ) : (
                <>
                  <SheetClose asChild>
                    <Button asChild variant="secondary">
                      <Link href="/entrar">Entrar</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild>
                      <Link href="/cadastro">Criar conta</Link>
                    </Button>
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'Conta';
}
