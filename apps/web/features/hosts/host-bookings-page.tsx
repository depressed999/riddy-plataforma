'use client';

import { CalendarDays, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageConversationButton } from '@/features/messages/message-conversation-button';

import { useHost } from './host-provider';
import { listHostBookings } from './host.service';
import {
  HostPageFrame,
  HostPageHeading,
  HostPageState,
  messageFrom,
} from './host-shared';
import type { HostBooking } from './host.types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
});
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });
const statuses = {
  cancelled: { label: 'Cancelada', variant: 'default' as const },
  completed: { label: 'Concluída', variant: 'primary' as const },
  confirmed: { label: 'Confirmada', variant: 'success' as const },
  pending: { label: 'Aguardando pagamento', variant: 'warning' as const },
};

export function HostBookingsPage() {
  const { dashboard } = useHost();
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!dashboard?.profile) return;
    let active = true;
    void listHostBookings()
      .then((response) => {
        if (active) setBookings(response);
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
          description="Acompanhe solicitações, pagamentos e períodos de retirada dos seus veículos."
          title="Reservas recebidas"
        />
        {error ? (
          <Alert className="mt-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {isLoading ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            className="mt-8"
            description="Quando um locatário reservar um veículo seu, o acompanhamento aparecerá aqui."
            icon={CalendarDays}
            title="Nenhuma reserva recebida"
          />
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {bookings.map((booking) => {
              const status = statuses[booking.status];
              return (
                <Card key={booking.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-heading text-lg font-semibold">
                          {booking.vehicle.make} {booking.vehicle.model}
                        </h2>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <UserRound aria-hidden="true" size={15} />
                          {booking.renter.name}
                        </p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                      <Data
                        label="Retirada"
                        value={formatDate(booking.pickupDate)}
                      />
                      <Data
                        label="Devolução"
                        value={formatDate(booking.returnDate)}
                      />
                      <Data
                        label="Duração"
                        value={`${booking.totalDays} dias`}
                      />
                      <Data
                        label="Valor bruto"
                        value={currencyFormatter.format(booking.totalPrice)}
                      />
                    </dl>
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">
                      O pagamento aprovado confirma automaticamente a reserva.
                      Nenhuma ação manual é necessária.
                    </p>
                    <div className="mt-4">
                      <MessageConversationButton
                        bookingId={booking.id}
                        label={`Conversar com ${booking.renter.name.split(/\s+/)[0] ?? 'locatário'}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </HostPageFrame>
    </HostPageState>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-heading font-medium">{value}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}
