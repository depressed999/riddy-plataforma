import type { ReactNode } from 'react';

export function AdminPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      {children}
    </div>
  );
}

export function AdminPageHeading({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div>
      <p className="font-heading text-xs font-semibold tracking-[0.12em] text-primary-strong uppercase">
        Administração Riddy
      </p>
      <h1 className="mt-1 font-heading text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const positive = [
    'active',
    'approved',
    'confirmed',
    'completed',
    'succeeded',
  ].includes(value);
  const pending = [
    'draft',
    'pending',
    'pending_review',
    'created',
    'in_process',
  ].includes(value);
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 font-heading text-xs font-medium ${positive ? 'bg-success-muted text-success' : pending ? 'bg-warning-muted text-warning' : 'bg-muted text-muted-foreground'}`}
    >
      {statusLabel(value)}
    </span>
  );
}

export function statusLabel(value: string): string {
  return (
    (
      {
        active: 'Ativo',
        approved: 'Aprovado',
        cancelled: 'Cancelado',
        charged_back: 'Contestada',
        completed: 'Concluída',
        confirmed: 'Confirmada',
        created: 'Criado',
        draft: 'Rascunho',
        error: 'Erro',
        in_process: 'Processando',
        inactive: 'Inativo',
        maintenance: 'Manutenção',
        pending: 'Pendente',
        pending_review: 'Em análise',
        refunded: 'Reembolsado',
        rejected: 'Rejeitado',
        reviewer: 'Analista',
        suspended: 'Suspenso',
        admin: 'Administrador',
        user: 'Usuário',
      } as Record<string, string>
    )[value] ?? value
  );
}
