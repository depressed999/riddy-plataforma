'use client';

import {
  Banknote,
  CarFront,
  ClipboardCheck,
  ClipboardList,
  MessageCircle,
  UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageFrame, AdminPageHeading } from './admin-shared';
import { getAdminDashboard } from './admin.service';
import type { AdminDashboard } from './admin.types';

const money = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
});

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void getAdminDashboard()
      .then((value) => {
        if (active) setData(value);
      })
      .catch((caught: unknown) => {
        if (active)
          setError(
            caught instanceof Error ? caught.message : 'Painel indisponível.',
          );
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <AdminPageFrame>
      <AdminPageHeading
        description="Indicadores operacionais sem exposição do conteúdo privado das conversas."
        title="Visão geral"
      />
      {error ? (
        <Alert className="mt-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!data && !error ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton className="h-36" key={i} />
          ))}
        </div>
      ) : null}
      {data ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Metric
            icon={UsersRound}
            label="Usuários"
            detail={`${data.users.suspended} suspensos`}
            value={data.users.total}
          />
          <Metric
            icon={CarFront}
            label="Veículos ativos"
            detail={`${data.vehicles.total} cadastrados`}
            value={data.vehicles.active}
          />
          <Metric
            icon={ClipboardList}
            label="Reservas"
            detail={`${data.bookings.pending} pendentes`}
            value={data.bookings.total}
          />
          <Metric
            icon={Banknote}
            label="Volume aprovado"
            detail={`${data.payments.pending} pagamentos pendentes`}
            value={money.format(data.payments.approvedAmount)}
          />
          <Metric
            icon={ClipboardCheck}
            label="KYC aguardando análise"
            detail="Fila protegida de documentos"
            value={data.kyc.pending}
          />
          <Metric
            icon={MessageCircle}
            label="Conversas"
            detail={`${data.messages.total} mensagens — conteúdo oculto`}
            value={data.messages.conversations}
          />
        </div>
      ) : null}
    </AdminPageFrame>
  );
}

function Metric({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: typeof UsersRound;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <Icon className="text-primary-strong" size={22} />
          <span className="font-heading text-2xl font-semibold">{value}</span>
        </div>
        <p className="mt-5 font-heading text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
