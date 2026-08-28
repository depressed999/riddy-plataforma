'use client';

import { Loader2, RefreshCw, Search, Settings2 } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/auth-provider';
import {
  AdminPageFrame,
  AdminPageHeading,
  statusLabel,
  StatusPill,
} from './admin-shared';
import {
  listAdminAudit,
  listAdminBookings,
  listAdminPayments,
  listAdminUsers,
  listAdminVehicles,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateAdminVehicleStatus,
} from './admin.service';
import type {
  AdminAudit,
  AdminBooking,
  AdminPage,
  AdminPayment,
  AdminUser,
  AdminVehicle,
} from './admin.types';

type Resource = 'audit' | 'bookings' | 'payments' | 'users' | 'vehicles';
type Row = AdminAudit | AdminBooking | AdminPayment | AdminUser | AdminVehicle;
type Action =
  | { kind: 'role'; target: AdminUser; value: AdminUser['role'] }
  | { kind: 'userStatus'; target: AdminUser; value: AdminUser['status'] }
  | {
      kind: 'vehicleStatus';
      target: AdminVehicle;
      value: AdminVehicle['status'];
    };

const config = {
  audit: {
    description:
      'Histórico imutável das decisões administrativas e seus motivos.',
    title: 'Auditoria',
  },
  bookings: {
    description:
      'Acompanhe períodos, locatários, veículos e situação das reservas.',
    title: 'Reservas',
  },
  payments: {
    description:
      'Conciliação operacional de cobranças. Estornos continuam no fluxo financeiro protegido.',
    title: 'Pagamentos',
  },
  users: {
    description:
      'Gerencie acesso, funções e suspensão de contas com trilha de auditoria.',
    title: 'Usuários',
  },
  vehicles: {
    description: 'Modere anúncios e altere sua disponibilidade administrativa.',
    title: 'Veículos',
  },
} satisfies Record<Resource, { description: string; title: string }>;

const statusOptions: Record<Resource, { label: string; value: string }[]> = {
  audit: [],
  bookings: options(['pending', 'confirmed', 'cancelled', 'completed']),
  payments: options([
    'created',
    'pending',
    'in_process',
    'approved',
    'rejected',
    'cancelled',
    'refunded',
    'charged_back',
    'error',
  ]),
  users: options(['active', 'suspended']),
  vehicles: options(['draft', 'active', 'inactive', 'maintenance']),
};

export function AdminResourcePage({ resource }: { resource: Resource }) {
  const { user } = useAuth();
  const [data, setData] = useState<AdminPage<Row> | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (submittedQuery) params.set('query', submittedQuery);
    if (status) params.set('status', status);
    try {
      const loaders = {
        audit: listAdminAudit,
        bookings: listAdminBookings,
        payments: listAdminPayments,
        users: listAdminUsers,
        vehicles: listAdminVehicles,
      };
      setData((await loaders[resource](params.toString())) as AdminPage<Row>);
    } catch (caught) {
      setError(message(caught));
    } finally {
      setLoading(false);
    }
  }, [page, resource, status, submittedQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSubmittedQuery(query.trim());
  }
  function openAction(next: Action) {
    setAction(next);
    setReason('');
  }
  async function submitAction(event: FormEvent) {
    event.preventDefault();
    if (!action) return;
    setSaving(true);
    setError('');
    try {
      if (action.kind === 'role')
        await updateAdminUserRole(action.target.id, action.value, reason);
      else if (action.kind === 'userStatus')
        await updateAdminUserStatus(action.target.id, action.value, reason);
      else
        await updateAdminVehicleStatus(action.target.id, action.value, reason);
      setAction(null);
      await load();
    } catch (caught) {
      setError(message(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageFrame>
      <AdminPageHeading {...config[resource]} />
      <form
        className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row"
        onSubmit={search}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-3.5 left-3 text-muted-foreground"
            size={18}
          />
          <Input
            aria-label="Buscar"
            className="pl-10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              resource === 'audit'
                ? 'Ação, motivo ou administrador'
                : 'Nome, e-mail ou veículo'
            }
            value={query}
          />
        </div>
        {statusOptions[resource].length ? (
          <select
            aria-label="Filtrar por status"
            className="h-12 rounded-md border border-input bg-card px-4 text-sm"
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            value={status}
          >
            <option value="">Todos os status</option>
            {statusOptions[resource].map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        ) : null}
        <Button type="submit">
          <Search size={17} />
          Buscar
        </Button>
        <Button
          aria-label="Atualizar lista"
          onClick={() => void load()}
          type="button"
          variant="secondary"
        >
          <RefreshCw size={17} />
          Atualizar
        </Button>
      </form>
      {error ? (
        <Alert className="mt-5" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? (
        <div className="mt-5 grid gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <ResourceTable
              currentUserId={user?.id}
              data={data?.items ?? []}
              onAction={openAction}
              resource={resource}
            />
          </div>
          {data ? (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {data.meta.total} registro(s) · página {data.meta.page} de{' '}
                {Math.max(data.meta.totalPages, 1)}
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  size="sm"
                  variant="secondary"
                >
                  Anterior
                </Button>
                <Button
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  size="sm"
                  variant="secondary"
                >
                  Próxima
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
      <Dialog
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        open={Boolean(action)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alteração</DialogTitle>
            <DialogDescription>{actionDescription(action)}</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={submitAction}>
            {action?.kind === 'role' ? (
              <select
                aria-label="Nova função"
                className="h-12 rounded-md border border-input bg-card px-4 text-sm"
                onChange={(event) =>
                  setAction({
                    ...action,
                    value: event.target.value as AdminUser['role'],
                  })
                }
                value={action.value}
              >
                {options(['user', 'reviewer', 'admin']).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
            {action?.kind === 'vehicleStatus' ? (
              <select
                aria-label="Novo status"
                className="h-12 rounded-md border border-input bg-card px-4 text-sm"
                onChange={(event) =>
                  setAction({
                    ...action,
                    value: event.target.value as AdminVehicle['status'],
                  })
                }
                value={action.value}
              >
                {statusOptions.vehicles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
            <div>
              <label
                className="mb-1.5 block font-heading text-sm font-medium"
                htmlFor="admin-reason"
              >
                Motivo obrigatório
              </label>
              <Textarea
                id="admin-reason"
                minLength={10}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Registre o contexto da decisão (mínimo 10 caracteres)."
                required
                value={reason}
              />
            </div>
            <DialogFooter>
              <Button disabled={saving} type="submit">
                {saving ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Settings2 size={17} />
                )}
                Confirmar e auditar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageFrame>
  );
}

function ResourceTable({
  currentUserId,
  data,
  onAction,
  resource,
}: {
  currentUserId?: string;
  data: Row[];
  onAction(action: Action): void;
  resource: Resource;
}) {
  if (!data.length)
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Nenhum registro encontrado.
      </div>
    );
  if (resource === 'users')
    return (
      <table className="w-full min-w-[900px] text-left text-sm">
        <Head labels={['Usuário', 'Função', 'Status', 'Cadastro', 'Ações']} />
        <tbody>
          {(data as AdminUser[]).map((row) => (
            <tr className="border-t border-border" key={row.id}>
              <Cell>
                <strong className="block font-heading">{row.name}</strong>
                <span className="text-muted-foreground">{row.email}</span>
              </Cell>
              <Cell>
                <StatusPill value={row.role} />
              </Cell>
              <Cell>
                <StatusPill value={row.status} />
                {row.suspensionReason ? (
                  <span className="mt-1 block max-w-52 text-xs text-muted-foreground">
                    {row.suspensionReason}
                  </span>
                ) : null}
              </Cell>
              <Cell>{date(row.createdAt)}</Cell>
              <Cell>
                {row.id === currentUserId ? (
                  <span className="text-xs text-muted-foreground">
                    Conta atual protegida
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        onAction({ kind: 'role', target: row, value: row.role })
                      }
                      size="sm"
                      variant="secondary"
                    >
                      Função
                    </Button>
                    <Button
                      onClick={() =>
                        onAction({
                          kind: 'userStatus',
                          target: row,
                          value:
                            row.status === 'active' ? 'suspended' : 'active',
                        })
                      }
                      size="sm"
                      variant={
                        row.status === 'active' ? 'secondary' : 'primary'
                      }
                    >
                      {row.status === 'active' ? 'Suspender' : 'Reativar'}
                    </Button>
                  </div>
                )}
              </Cell>
            </tr>
          ))}
        </tbody>
      </table>
    );
  if (resource === 'vehicles')
    return (
      <table className="w-full min-w-[920px] text-left text-sm">
        <Head
          labels={[
            'Veículo',
            'Proprietário',
            'Local',
            'Diária',
            'Status',
            'Ação',
          ]}
        />
        <tbody>
          {(data as AdminVehicle[]).map((row) => (
            <tr className="border-t border-border" key={row.id}>
              <Cell>
                <strong className="font-heading">
                  {row.make} {row.model}
                </strong>
                <span className="ml-2 text-muted-foreground">{row.year}</span>
              </Cell>
              <Cell>
                {row.ownerName}
                <span className="block text-xs text-muted-foreground">
                  {row.ownerEmail}
                </span>
              </Cell>
              <Cell>
                {row.city}/{row.state}
              </Cell>
              <Cell>{currency(row.dailyRate)}</Cell>
              <Cell>
                <StatusPill value={row.status} />
              </Cell>
              <Cell>
                <Button
                  onClick={() =>
                    onAction({
                      kind: 'vehicleStatus',
                      target: row,
                      value: row.status,
                    })
                  }
                  size="sm"
                  variant="secondary"
                >
                  Alterar status
                </Button>
              </Cell>
            </tr>
          ))}
        </tbody>
      </table>
    );
  if (resource === 'bookings')
    return (
      <table className="w-full min-w-[900px] text-left text-sm">
        <Head labels={['Reserva', 'Locatário', 'Período', 'Valor', 'Status']} />
        <tbody>
          {(data as AdminBooking[]).map((row) => (
            <tr className="border-t border-border" key={row.id}>
              <Cell>
                <strong className="font-heading">{row.vehicleName}</strong>
                <span className="block text-xs text-muted-foreground">
                  {shortId(row.id)}
                </span>
              </Cell>
              <Cell>
                {row.renterName}
                <span className="block text-xs text-muted-foreground">
                  {row.renterEmail}
                </span>
              </Cell>
              <Cell>
                {dateOnly(row.pickupDate)} – {dateOnly(row.returnDate)}
              </Cell>
              <Cell>{currency(row.totalPrice)}</Cell>
              <Cell>
                <StatusPill value={row.status} />
              </Cell>
            </tr>
          ))}
        </tbody>
      </table>
    );
  if (resource === 'payments')
    return (
      <table className="w-full min-w-[950px] text-left text-sm">
        <Head
          labels={[
            'Pagamento',
            'Reserva/veículo',
            'Pagador',
            'Método',
            'Valor',
            'Status',
          ]}
        />
        <tbody>
          {(data as AdminPayment[]).map((row) => (
            <tr className="border-t border-border" key={row.id}>
              <Cell>
                {shortId(row.id)}
                <span className="block text-xs text-muted-foreground">
                  {date(row.createdAt)}
                </span>
              </Cell>
              <Cell>
                {row.vehicleName}
                <span className="block text-xs text-muted-foreground">
                  {shortId(row.bookingId)}
                </span>
              </Cell>
              <Cell>{row.payerEmail}</Cell>
              <Cell>{row.method.toUpperCase()}</Cell>
              <Cell>{currency(row.amount)}</Cell>
              <Cell>
                <StatusPill value={row.status} />
              </Cell>
            </tr>
          ))}
        </tbody>
      </table>
    );
  return (
    <table className="w-full min-w-[980px] text-left text-sm">
      <Head
        labels={['Data', 'Administrador', 'Ação', 'Alvo', 'Motivo', 'Mudança']}
      />
      <tbody>
        {(data as AdminAudit[]).map((row) => (
          <tr className="border-t border-border align-top" key={row.id}>
            <Cell>{date(row.createdAt)}</Cell>
            <Cell>
              {row.actorName}
              <span className="block text-xs text-muted-foreground">
                {row.actorEmail}
              </span>
            </Cell>
            <Cell>
              <code className="text-xs">{row.action}</code>
            </Cell>
            <Cell>
              {row.targetType}
              <span className="block text-xs text-muted-foreground">
                {row.targetId ? shortId(row.targetId) : '—'}
              </span>
            </Cell>
            <Cell>
              <span className="block max-w-72 whitespace-normal">
                {row.reason}
              </span>
            </Cell>
            <Cell>
              {'from' in row.metadata
                ? `${statusLabel(String(row.metadata.from))} → ${statusLabel(String(row.metadata.to))}`
                : '—'}
            </Cell>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Head({ labels }: { labels: string[] }) {
  return (
    <thead className="bg-muted/60">
      <tr>
        {labels.map((label) => (
          <th
            className="px-4 py-3 font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            key={label}
          >
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
function Cell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}
function options(values: string[]) {
  return values.map((value) => ({ label: statusLabel(value), value }));
}
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}
function date(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
function dateOnly(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`),
  );
}
function currency(value: string) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(Number(value));
}
function shortId(value: string) {
  return value.slice(0, 8);
}
function actionDescription(action: Action | null) {
  if (!action) return '';
  if (action.kind === 'role')
    return `Alterar a função de ${action.target.name}.`;
  if (action.kind === 'userStatus')
    return `${action.value === 'suspended' ? 'Suspender' : 'Reativar'} a conta de ${action.target.name}.`;
  return `Alterar o status de ${action.target.make} ${action.target.model}.`;
}
