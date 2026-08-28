'use client';

import { CircleDollarSign, Clock3, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useHost } from './host-provider';
import { getHostFinance } from './host.service';
import {
  HostPageFrame,
  HostPageHeading,
  HostPageState,
  messageFrom,
} from './host-shared';
import type { HostFinance } from './host.types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
});

export function HostFinancePage() {
  const { dashboard } = useHost();
  const [finance, setFinance] = useState<HostFinance | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!dashboard?.profile) return;
    let active = true;
    void getHostFinance()
      .then((response) => {
        if (active) setFinance(response);
      })
      .catch((caughtError: unknown) => {
        if (active) setError(messageFrom(caughtError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dashboard?.profile]);

  return (
    <HostPageState>
      <HostPageFrame>
        <HostPageHeading
          description="Acompanhe valores brutos processados nas reservas dos seus veículos."
          title="Financeiro"
        />
        <Alert className="mt-6">
          <AlertTitle>Resumo informativo</AlertTitle>
          <AlertDescription>
            Taxas da plataforma, repasses e conta bancária ainda não estão
            modelados. Por isso, nenhum valor é apresentado como saldo líquido.
          </AlertDescription>
        </Alert>
        {error ? (
          <Alert className="mt-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {isLoading || !finance ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <FinanceCard
              description={`${finance.approvedBookings} pagamento(s) aprovado(s)`}
              icon={CircleDollarSign}
              label="Receita bruta aprovada"
              value={currencyFormatter.format(finance.approvedGross)}
            />
            <FinanceCard
              description="Pagamentos criados, pendentes ou em análise"
              icon={Clock3}
              label="Em processamento"
              value={currencyFormatter.format(finance.pendingGross)}
            />
            <FinanceCard
              description="Total devolvido aos locatários"
              icon={RotateCcw}
              label="Reembolsado"
              value={currencyFormatter.format(finance.refundedGross)}
            />
          </div>
        )}
      </HostPageFrame>
    </HostPageState>
  );
}

function FinanceCard({
  description,
  icon: Icon,
  label,
  value,
}: {
  description: string;
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent>
        <Icon aria-hidden="true" className="text-primary-strong" size={23} />
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
