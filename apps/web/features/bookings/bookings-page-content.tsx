'use client';

import {
  CalendarDays,
  CalendarX2,
  CarFront,
  Loader2,
  MapPin,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Container } from '@/components/layout/container';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-provider';
import { MessageConversationButton } from '@/features/messages/message-conversation-button';

import {
  BookingUnauthorizedError,
  cancelBooking,
  getMyBookings,
} from './bookings.service';
import type { Booking, BookingStatus } from './bookings.types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  maximumFractionDigits: 2,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const statusPresentation: Record<
  BookingStatus,
  { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }
> = {
  cancelled: { label: 'Cancelada', variant: 'default' },
  completed: { label: 'Concluída', variant: 'primary' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
};

export function BookingsPageContent() {
  const { isLoading: isSessionLoading, user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (!user) {
      router.replace('/entrar?next=/reservas');
      return;
    }

    let active = true;
    void getMyBookings()
      .then((response) => {
        if (active) {
          setBookings(response);
          setError('');
        }
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof BookingUnauthorizedError) {
          router.replace('/entrar?next=/reservas');
          return;
        }

        if (active) {
          setError('Não foi possível carregar suas reservas.');
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
  }, [isSessionLoading, router, user]);

  async function handleCancel(): Promise<void> {
    if (!selectedBooking) {
      return;
    }

    setIsCancelling(true);
    setError('');
    try {
      const cancelled = await cancelBooking(selectedBooking.id);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === cancelled.id ? cancelled : booking,
        ),
      );
      setSelectedBooking(null);
    } catch (caughtError) {
      if (caughtError instanceof BookingUnauthorizedError) {
        router.replace('/entrar?next=/reservas');
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível cancelar a reserva.',
      );
      setSelectedBooking(null);
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <PageHeader
        description="Consulte períodos, valores e o status das solicitações feitas na Riddy."
        eyebrow="Sua jornada"
        title="Minhas reservas"
      />

      <Alert className="mt-6" variant="default">
        <AlertDescription>
          Reservas criadas no checkout nascem como pendentes. Conclua o
          pagamento por cartão ou Pix para que a reserva seja confirmada.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert className="mt-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading || isSessionLoading ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/buscar">Encontrar um veículo</Link>
            </Button>
          }
          className="mt-8"
          description="Escolha um veículo e consulte as datas disponíveis para criar sua primeira reserva."
          icon={CalendarDays}
          title="Você ainda não possui reservas"
        />
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {bookings.map((booking) => (
            <BookingCard
              booking={booking}
              key={booking.id}
              onCancel={() => setSelectedBooking(booking)}
            />
          ))}
        </div>
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open && !isCancelling) {
            setSelectedBooking(null);
          }
        }}
        open={Boolean(selectedBooking)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar esta reserva?</DialogTitle>
            <DialogDescription>
              O período voltará a ficar disponível para outras pessoas. Esta
              ação não pode ser desfeita nesta etapa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isCancelling} variant="secondary">
                Manter reserva
              </Button>
            </DialogClose>
            <Button
              disabled={isCancelling}
              onClick={() => void handleCancel()}
              variant="destructive"
            >
              {isCancelling ? (
                <Loader2
                  aria-hidden="true"
                  className="animate-spin"
                  size={18}
                />
              ) : (
                <CalendarX2 aria-hidden="true" size={18} />
              )}
              {isCancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

function BookingCard({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel(): void;
}) {
  const status = statusPresentation[booking.status];
  const canCancel =
    ['pending', 'confirmed'].includes(booking.status) &&
    booking.pickupDate > new Date().toISOString().slice(0, 10);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative min-h-44 bg-muted sm:min-h-full">
          {booking.vehicle.imageUrl ? (
            <Image
              alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
              className="object-cover"
              fill
              loading="eager"
              sizes="(max-width: 640px) 100vw, 180px"
              src={`/${booking.vehicle.imageUrl.replace(/^\/+/, '')}`}
            />
          ) : (
            <div className="grid h-full min-h-44 place-items-center text-muted-foreground">
              <CarFront aria-hidden="true" size={36} />
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold">
                {booking.vehicle.make} {booking.vehicle.model}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin aria-hidden="true" size={15} />
                {booking.vehicle.city}, {booking.vehicle.state}
              </p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Retirada</dt>
              <dd className="mt-1 font-heading font-medium">
                {formatDate(booking.pickupDate)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Devolução</dt>
              <dd className="mt-1 font-heading font-medium">
                {formatDate(booking.returnDate)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Duração</dt>
              <dd className="mt-1 font-heading font-medium">
                {booking.totalDays} {booking.totalDays === 1 ? 'dia' : 'dias'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Valor</dt>
              <dd className="mt-1 font-heading font-semibold">
                {currencyFormatter.format(booking.totalPrice)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-3">
            <MessageConversationButton
              bookingId={booking.id}
              label="Conversar com anfitrião"
            />
            {booking.status === 'pending' ? (
              <Button asChild size="sm">
                <Link href={`/pagamentos/${booking.id}`}>Pagar reserva</Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="secondary">
              <Link href={`/veiculos/${booking.vehicle.id}`}>Ver veículo</Link>
            </Button>
            {canCancel ? (
              <Button onClick={onCancel} size="sm" variant="ghost">
                Cancelar reserva
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}
