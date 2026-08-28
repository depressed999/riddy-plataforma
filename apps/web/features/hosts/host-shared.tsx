'use client';

import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useHost } from './host-provider';

export function HostPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      {children}
    </div>
  );
}

export function HostPageHeading({
  actions,
  description,
  title,
}: {
  actions?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="font-heading text-xs font-semibold tracking-[0.12em] text-primary-strong uppercase">
          Área do anfitrião
        </p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actions}
    </div>
  );
}

export function HostPageState({ children }: { children: ReactNode }) {
  const { dashboard, error, isLoading } = useHost();
  if (isLoading) {
    return (
      <HostPageFrame>
        <Skeleton className="h-24" />
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </HostPageFrame>
    );
  }
  if (error) {
    return (
      <HostPageFrame>
        <Alert variant="destructive">
          <AlertTitle>Área indisponível</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </HostPageFrame>
    );
  }
  if (!dashboard?.profile) {
    return (
      <HostPageFrame>
        <Alert variant="warning">
          <ShieldCheck aria-hidden="true" size={19} />
          <AlertTitle>Crie seu perfil de anfitrião</AlertTitle>
          <AlertDescription>
            Conclua a configuração inicial antes de acessar este módulo.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-5">
          <Link href="/anfitriao">
            Ir para a configuração
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </Button>
      </HostPageFrame>
    );
  }
  return children;
}

export function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}
