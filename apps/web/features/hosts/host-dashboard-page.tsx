'use client';

import {
  ArrowRight,
  CalendarRange,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/auth-provider';

import { useHost } from './host-provider';
import { onboardHost } from './host.service';
import { HostPageFrame, HostPageHeading, messageFrom } from './host-shared';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
});

export function HostDashboardPage() {
  const { dashboard, error: loadError, isLoading, refresh } = useHost();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setError('');
    try {
      await onboardHost({
        acceptTerms: formData.get('acceptTerms') === 'on',
        bio: String(formData.get('bio') ?? ''),
        displayName: String(formData.get('displayName') ?? ''),
        supportPhone: String(formData.get('supportPhone') ?? ''),
      });
      await refresh();
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <HostPageFrame>
        <Skeleton className="h-28" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-36" key={index} />
          ))}
        </div>
      </HostPageFrame>
    );
  }

  if (loadError || !dashboard) {
    return (
      <HostPageFrame>
        <Alert variant="destructive">
          <AlertTitle>Painel indisponível</AlertTitle>
          <AlertDescription>
            {loadError || 'Não foi possível carregar o painel.'}
          </AlertDescription>
        </Alert>
      </HostPageFrame>
    );
  }

  if (!dashboard.profile) {
    return (
      <HostPageFrame>
        <HostPageHeading
          description="Comece com seus dados de atendimento. Você poderá cadastrar veículos em rascunho enquanto conclui a verificação."
          title="Torne-se anfitrião"
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form
            className="rounded-xl border border-border bg-card p-6 sm:p-8"
            onSubmit={handleOnboarding}
          >
            <h2 className="font-heading text-xl font-semibold">
              Perfil de anfitrião
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Estas informações representam você para os futuros locatários.
            </p>
            {error ? (
              <Alert className="mt-5" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="mt-6 grid gap-5">
              <Field label="Nome de exibição" name="displayName">
                <Input
                  defaultValue={user?.name ?? ''}
                  id="host-displayName"
                  minLength={2}
                  name="displayName"
                  required
                />
              </Field>
              <Field label="Telefone de atendimento" name="supportPhone">
                <Input
                  id="host-supportPhone"
                  name="supportPhone"
                  pattern="[+0-9() .-]{8,24}"
                  placeholder="+55 (92) 99999-9999"
                  type="tel"
                />
              </Field>
              <Field label="Apresentação" name="bio">
                <Textarea
                  id="host-bio"
                  maxLength={500}
                  name="bio"
                  placeholder="Conte como você cuida dos veículos e recebe seus locatários."
                />
              </Field>
              <label className="flex items-start gap-3 rounded-md border border-border bg-muted/50 p-4 text-sm leading-6">
                <input
                  className="mt-1 size-4 accent-primary-strong"
                  name="acceptTerms"
                  required
                  type="checkbox"
                />
                Confirmo que os dados são verdadeiros e aceito as regras para
                disponibilização de veículos na Riddy.
              </label>
              <Button disabled={isSaving} size="lg">
                {isSaving ? (
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <ArrowRight aria-hidden="true" size={18} />
                )}
                {isSaving ? 'Criando perfil...' : 'Criar perfil de anfitrião'}
              </Button>
            </div>
          </form>

          <Card>
            <CardContent>
              <ShieldCheck
                aria-hidden="true"
                className="text-primary-strong"
                size={28}
              />
              <h2 className="mt-4 font-heading text-lg font-semibold">
                Verificação necessária
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Você pode preparar anúncios agora. A publicação exige KYC
                aprovado para proteger os dois lados da locação.
              </p>
              <Badge className="mt-4" variant="warning">
                {kycLabel(dashboard.kycStatus)}
              </Badge>
              <Button asChild className="mt-5 w-full" variant="secondary">
                <Link href="/perfil/documentos">Ver meus documentos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </HostPageFrame>
    );
  }

  const metrics = dashboard.metrics;
  return (
    <HostPageFrame>
      <HostPageHeading
        actions={
          <Button asChild>
            <Link href="/anfitriao/veiculos/novo">
              <CarFront aria-hidden="true" size={18} />
              Adicionar veículo
            </Link>
          </Button>
        }
        description={`Acompanhe os pontos importantes da operação de ${dashboard.profile.displayName}.`}
        title="Visão geral"
      />

      {dashboard.profile.status !== 'active' ? (
        <Alert className="mt-6" variant="warning">
          <ShieldCheck aria-hidden="true" size={19} />
          <AlertTitle>Publicação aguardando verificação</AlertTitle>
          <AlertDescription>
            Cadastre seus veículos em rascunho e conclua o KYC para ativá-los.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mt-6" variant="success">
          <CheckCircle2 aria-hidden="true" size={19} />
          <AlertTitle>Conta pronta para publicar</AlertTitle>
          <AlertDescription>
            Sua verificação está aprovada e os módulos operacionais estão
            ativos.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CarFront}
          label="Veículos ativos"
          value={`${metrics.activeVehicles} de ${metrics.totalVehicles}`}
        />
        <MetricCard
          icon={CalendarRange}
          label="Reservas confirmadas"
          value={String(metrics.confirmedBookings)}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Aguardando pagamento"
          value={String(metrics.pendingBookings)}
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Receita bruta aprovada"
          value={currencyFormatter.format(metrics.approvedGross)}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <QuickLink
          description="Cadastre, revise e publique seus carros e motos."
          href="/anfitriao/veiculos"
          icon={CarFront}
          title="Gerenciar frota"
        />
        <QuickLink
          description="Veja solicitações e períodos já confirmados."
          href="/anfitriao/reservas"
          icon={CalendarRange}
          title="Acompanhar reservas"
        />
        <QuickLink
          description="Bloqueie datas em que o veículo não estará disponível."
          href="/anfitriao/calendario"
          icon={ShieldCheck}
          title="Organizar calendário"
        />
      </div>
    </HostPageFrame>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CarFront;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent>
        <Icon aria-hidden="true" className="text-primary-strong" size={22} />
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: typeof CarFront;
  title: string;
}) {
  return (
    <Link
      className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary-strong/35 hover:bg-muted/40"
      href={href}
    >
      <Icon aria-hidden="true" className="text-primary-strong" size={22} />
      <h2 className="mt-4 font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 font-heading text-sm font-medium text-primary-strong">
        Acessar <ArrowRight aria-hidden="true" size={15} />
      </span>
    </Link>
  );
}

function Field({
  children,
  label,
  name,
}: {
  children: React.ReactNode;
  label: string;
  name: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block font-heading text-sm font-medium"
        htmlFor={`host-${name}`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function kycLabel(status: HostDashboardPageStatus): string {
  return {
    approved: 'KYC aprovado',
    draft: 'Documentos em preenchimento',
    not_started: 'Documentos não iniciados',
    pending_review: 'Documentos em análise',
    rejected: 'Reenvio de documentos necessário',
  }[status];
}

type HostDashboardPageStatus =
  'approved' | 'draft' | 'not_started' | 'pending_review' | 'rejected';
