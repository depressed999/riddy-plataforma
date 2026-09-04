'use client';

import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Container } from '@/components/layout/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-provider';
import {
  BookingUnauthorizedError,
  createBooking,
  getBookingQuote,
} from '@/features/bookings/bookings.service';
import type { Booking, BookingQuote } from '@/features/bookings/bookings.types';
import type { Vehicle } from '@/features/marketplace/marketplace.types';
import {
  isUploadedVehicleImage,
  publicVehicleImageUrl,
} from '@/lib/vehicle-image-url';
import {
  getProfile,
  ProfileUnauthorizedError,
} from '@/features/profile/profile.service';
import type { UserProfile } from '@/features/profile/profile.types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  maximumFractionDigits: 2,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function CheckoutPageContent({
  pickupDate,
  returnDate,
  vehicle,
}: {
  pickupDate: string;
  returnDate: string;
  vehicle: Vehicle;
}) {
  const { isLoading: isSessionLoading, user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [acceptedReview, setAcceptedReview] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkoutPath = useMemo(
    () =>
      `/checkout?${new URLSearchParams({
        pickupDate,
        returnDate,
        vehicleId: vehicle.id,
      })}`,
    [pickupDate, returnDate, vehicle.id],
  );
  const loginPath = `/entrar?next=${encodeURIComponent(checkoutPath)}`;

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (!user) {
      router.replace(loginPath);
      return;
    }

    let active = true;

    void Promise.all([
      getBookingQuote({ pickupDate, returnDate, vehicleId: vehicle.id }),
      getProfile(),
    ])
      .then(([quoteResponse, profileResponse]) => {
        if (active) {
          setQuote(quoteResponse);
          setProfile(profileResponse);
          setError('');
        }
      })
      .catch((caughtError: unknown) => {
        if (
          caughtError instanceof BookingUnauthorizedError ||
          caughtError instanceof ProfileUnauthorizedError
        ) {
          router.replace(loginPath);
          return;
        }

        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Não foi possível preparar o checkout.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    isSessionLoading,
    loginPath,
    pickupDate,
    returnDate,
    router,
    user,
    vehicle.id,
  ]);

  async function handleConfirm(): Promise<void> {
    if (!quote?.available || !profile || !acceptedReview) {
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await createBooking({
        pickupDate: quote.pickupDate,
        returnDate: quote.returnDate,
        vehicleId: vehicle.id,
      });
      setBooking(response);
    } catch (caughtError) {
      if (caughtError instanceof BookingUnauthorizedError) {
        router.replace(loginPath);
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível confirmar a reserva.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (booking) {
    return <CheckoutSuccess booking={booking} />;
  }

  return (
    <Container className="py-7 sm:py-9 lg:py-12">
      <Link
        className="inline-flex items-center gap-2 font-heading text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        href={`/veiculos/${vehicle.id}`}
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Voltar ao veículo
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-heading text-xs font-medium tracking-[0.12em] text-primary-strong uppercase">
            Checkout
          </p>
          <h1 className="mt-2 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Revise e confirme sua reserva
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Confira o veículo, o período e seus dados antes de criar a
            solicitação pendente.
          </p>
        </div>
        <CheckoutSteps />
      </div>

      {error ? (
        <Alert className="mt-7" variant="destructive">
          <AlertTitle>Não foi possível continuar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading || isSessionLoading || !user ? (
        <CheckoutSkeleton />
      ) : quote && profile ? (
        quote.available ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
            <div className="space-y-6">
              <VehicleSection vehicle={vehicle} />
              <PeriodSection
                pickupDate={quote.pickupDate}
                returnDate={quote.returnDate}
                totalDays={quote.totalDays}
              />
              <RenterSection profile={profile} />
              <PaymentPreview />

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <input
                  checked={acceptedReview}
                  className="mt-0.5 size-4 shrink-0 accent-primary-strong"
                  onChange={(event) => setAcceptedReview(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm leading-6">
                  Revisei os dados e entendo que esta solicitação será criada
                  como pendente e sem cobrança.
                </span>
              </label>
            </div>

            <OrderSummary
              acceptedReview={acceptedReview}
              isSubmitting={isSubmitting}
              onConfirm={() => void handleConfirm()}
              quote={quote}
            />
          </div>
        ) : (
          <UnavailableState vehicleId={vehicle.id} />
        )
      ) : error ? (
        <div className="mt-6">
          <Button onClick={() => window.location.reload()} variant="secondary">
            Tentar novamente
          </Button>
        </div>
      ) : null}
    </Container>
  );
}

function CheckoutSteps() {
  const steps = [
    { current: false, label: 'Datas' },
    { current: true, label: 'Revisão' },
    { current: false, future: true, label: 'Pagamento' },
  ];

  return (
    <ol aria-label="Etapas da reserva" className="flex items-center gap-2">
      {steps.map((step, index) => (
        <li className="flex items-center gap-2" key={step.label}>
          {index > 0 ? <span className="h-px w-4 bg-border sm:w-7" /> : null}
          <span className="flex items-center gap-2">
            <span
              className={
                step.current
                  ? 'grid size-7 place-items-center rounded-full bg-primary font-heading text-xs font-semibold text-primary-foreground'
                  : step.future
                    ? 'grid size-7 place-items-center rounded-full border border-border bg-card font-heading text-xs text-muted-foreground'
                    : 'grid size-7 place-items-center rounded-full bg-success-muted text-success'
              }
            >
              {step.future ? index + 1 : <Check aria-hidden="true" size={15} />}
            </span>
            <span
              className={`hidden font-heading text-xs font-medium sm:inline ${step.future ? 'text-muted-foreground' : ''}`}
            >
              {step.label}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function VehicleSection({ vehicle }: { vehicle: Vehicle }) {
  const cover =
    vehicle.images.find((image) => image.isCover) ?? vehicle.images[0];

  return (
    <CheckoutSection icon={CarFront} title="Veículo">
      <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-[190px_minmax(0,1fr)]">
        <div className="relative min-h-40 bg-muted">
          {cover ? (
            <Image
              alt={cover.altText || `${vehicle.make} ${vehicle.model}`}
              className="object-cover"
              fill
              loading="eager"
              sizes="(max-width: 640px) 100vw, 190px"
              src={publicVehicleImageUrl(cover)}
              unoptimized={isUploadedVehicleImage(cover)}
            />
          ) : (
            <div className="grid h-full min-h-40 place-items-center text-muted-foreground">
              <CarFront aria-hidden="true" size={34} />
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">
              {vehicle.type === 'car' ? 'Carro' : 'Motocicleta'}
            </Badge>
            <Badge variant="outline">{vehicle.year}</Badge>
          </div>
          <h3 className="mt-3 font-heading text-xl font-semibold">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" size={15} />
            {vehicle.location.city}, {vehicle.location.state}
          </p>
        </div>
      </div>
    </CheckoutSection>
  );
}

function PeriodSection({
  pickupDate,
  returnDate,
  totalDays,
}: {
  pickupDate: string;
  returnDate: string;
  totalDays: number;
}) {
  return (
    <CheckoutSection icon={CalendarDays} title="Período da reserva">
      <dl className="grid gap-4 sm:grid-cols-3">
        <DataItem label="Retirada" value={formatDate(pickupDate)} />
        <DataItem label="Devolução" value={formatDate(returnDate)} />
        <DataItem
          label="Duração"
          value={`${totalDays} ${totalDays === 1 ? 'dia' : 'dias'}`}
        />
      </dl>
    </CheckoutSection>
  );
}

function RenterSection({ profile }: { profile: UserProfile }) {
  return (
    <CheckoutSection
      action={
        <Link
          className="font-heading text-sm font-medium text-primary-strong hover:underline"
          href="/perfil"
        >
          Editar perfil
        </Link>
      }
      icon={UserRound}
      title="Dados do locatário"
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <DataItem label="Nome" value={profile.name} />
        <DataItem label="E-mail" value={profile.email} />
        <DataItem label="Telefone" value={profile.phone || 'Não informado'} />
        <DataItem
          label="Localização"
          value={
            profile.city && profile.state
              ? `${profile.city}, ${profile.state}`
              : 'Não informada'
          }
        />
      </dl>
    </CheckoutSection>
  );
}

function PaymentPreview() {
  return (
    <CheckoutSection
      action={<Badge variant="outline">Após confirmar</Badge>}
      icon={CreditCard}
      title="Pagamento"
    >
      <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
        <LockKeyhole
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-primary-strong"
          size={19}
        />
        <p className="text-sm leading-6 text-muted-foreground">
          Nenhum cartão ou dado financeiro será solicitado nesta revisão. Após
          criar a reserva, você poderá pagar com cartão ou Pix pelo ambiente
          seguro do Mercado Pago.
        </p>
      </div>
    </CheckoutSection>
  );
}

function OrderSummary({
  acceptedReview,
  isSubmitting,
  onConfirm,
  quote,
}: {
  acceptedReview: boolean;
  isSubmitting: boolean;
  onConfirm(): void;
  quote: BookingQuote;
}) {
  return (
    <aside
      aria-label="Resumo do pedido"
      className="lg:sticky lg:top-24 lg:self-start"
    >
      <div className="rounded-xl border border-border border-t-4 border-t-primary bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">Resumo</h2>
          <Badge variant="warning">Pendente</Badge>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Valor da diária</dt>
            <dd className="font-heading font-medium">
              {currencyFormatter.format(quote.dailyRate)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Quantidade de dias</dt>
            <dd className="font-heading font-medium">{quote.totalDays}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-4">
            <dt className="font-heading font-semibold">Total da reserva</dt>
            <dd className="font-heading text-xl font-semibold">
              {currencyFormatter.format(quote.totalPrice)}
            </dd>
          </div>
        </dl>

        <Button
          className="mt-6 w-full"
          disabled={!acceptedReview || isSubmitting}
          onClick={onConfirm}
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          ) : (
            <CheckCircle2 aria-hidden="true" size={18} />
          )}
          {isSubmitting ? 'Confirmando...' : 'Confirmar reserva pendente'}
        </Button>

        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-primary-strong"
            size={16}
          />
          O preço e a disponibilidade são validados novamente pelo servidor ao
          confirmar. Nenhuma cobrança é feita.
        </p>
      </div>
    </aside>
  );
}

function UnavailableState({ vehicleId }: { vehicleId: string }) {
  return (
    <div className="mt-8 rounded-xl border border-warning/25 bg-warning-muted p-7 sm:p-9">
      <CalendarDays aria-hidden="true" className="text-warning" size={28} />
      <h2 className="mt-4 font-heading text-2xl font-semibold">
        O período não está mais disponível
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Outra reserva pode ter sido criada desde a consulta. Volte ao veículo e
        escolha novas datas para continuar.
      </p>
      <Button asChild className="mt-6" variant="secondary">
        <Link href={`/veiculos/${vehicleId}`}>Escolher outras datas</Link>
      </Button>
    </div>
  );
}

function CheckoutSuccess({ booking }: { booking: Booking }) {
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-2xl rounded-xl border border-success/25 bg-card p-7 text-center sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-success-muted text-success">
          <CheckCircle2 aria-hidden="true" size={30} />
        </div>
        <Badge className="mt-5" variant="warning">
          Reserva pendente
        </Badge>
        <h1 className="mt-3 font-heading text-3xl font-semibold">
          Solicitação criada com sucesso
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sua reserva de {booking.vehicle.make} {booking.vehicle.model} foi
          registrada. Agora você pode concluir o pagamento por cartão ou Pix.
        </p>

        <dl className="mt-7 grid gap-4 rounded-lg bg-muted p-5 text-left sm:grid-cols-3">
          <DataItem label="Retirada" value={formatDate(booking.pickupDate)} />
          <DataItem label="Devolução" value={formatDate(booking.returnDate)} />
          <DataItem
            label="Total"
            value={currencyFormatter.format(booking.totalPrice)}
          />
        </dl>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/pagamentos/${booking.id}`}>Ir para pagamento</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/reservas">Pagar depois</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}

function CheckoutSection({
  action,
  children,
  icon: Icon,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  icon: typeof CarFront;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-primary-muted text-primary-strong">
            <Icon aria-hidden="true" size={19} />
          </span>
          <h2 className="font-heading text-xl font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-heading text-sm font-medium">
        {value}
      </dd>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-44" />
        <Skeleton className="h-52" />
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}
