'use client';

import { CalendarCheck2, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBookingQuote } from '@/features/bookings/bookings.service';
import type { BookingQuote } from '@/features/bookings/bookings.types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  maximumFractionDigits: 2,
  style: 'currency',
});

const millisecondsPerDay = 86_400_000;

export function ReservationPanel({
  dailyRate,
  vehicleId,
}: {
  dailyRate: number;
  vehicleId: string;
}) {
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [today] = useState(() => formatLocalDate(new Date()));
  const clientDays = useMemo(
    () => calculateDays(pickupDate, returnDate),
    [pickupDate, returnDate],
  );

  function resetResult(): void {
    setQuote(null);
    setError('');
  }

  async function handleCheck(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');

    if (clientDays < 1) {
      setQuote(null);
      setError('Escolha uma devolução posterior à data de retirada.');
      return;
    }

    setIsChecking(true);
    try {
      const response = await getBookingQuote({
        pickupDate,
        returnDate,
        vehicleId,
      });
      setQuote(response);
    } catch (caughtError) {
      setQuote(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível verificar as datas.',
      );
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <aside
      aria-label="Painel de reserva"
      className="lg:sticky lg:top-24 lg:self-start"
    >
      <div className="rounded-lg border border-border border-t-4 border-t-primary bg-card p-5 sm:p-6">
        <p className="text-sm text-muted-foreground">Diária a partir de</p>
        <p className="mt-1">
          <span className="font-heading text-3xl font-semibold">
            {currencyFormatter.format(dailyRate)}
          </span>
          <span className="text-muted-foreground"> / dia</span>
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleCheck}>
          <div>
            <label
              className="mb-1.5 block font-heading text-sm font-medium"
              htmlFor="reservation-pickup"
            >
              Retirada
            </label>
            <Input
              id="reservation-pickup"
              min={today}
              onChange={(event) => {
                setPickupDate(event.target.value);
                resetResult();
              }}
              required
              type="date"
              value={pickupDate}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block font-heading text-sm font-medium"
              htmlFor="reservation-return"
            >
              Devolução
            </label>
            <Input
              id="reservation-return"
              min={pickupDate || today}
              onChange={(event) => {
                setReturnDate(event.target.value);
                resetResult();
              }}
              required
              type="date"
              value={returnDate}
            />
          </div>

          <Button
            className="w-full"
            disabled={isChecking}
            size="lg"
            type="submit"
            variant="secondary"
          >
            {isChecking ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={18} />
            ) : (
              <CalendarCheck2 aria-hidden="true" size={18} />
            )}
            {isChecking ? 'Verificando...' : 'Verificar disponibilidade'}
          </Button>
        </form>

        {quote ? (
          <div className="mt-5 space-y-4">
            <Alert variant={quote.available ? 'success' : 'warning'}>
              <AlertDescription>
                {quote.available
                  ? 'Veículo disponível para as datas escolhidas.'
                  : 'Este veículo já possui uma reserva nesse período.'}
              </AlertDescription>
            </Alert>

            <dl className="space-y-3 border-y border-border py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {currencyFormatter.format(quote.dailyRate)} ×{' '}
                  {quote.totalDays} {quote.totalDays === 1 ? 'dia' : 'dias'}
                </dt>
                <dd className="font-heading font-medium">
                  {currencyFormatter.format(quote.totalPrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 font-heading font-semibold">
                <dt>Total da reserva</dt>
                <dd>{currencyFormatter.format(quote.totalPrice)}</dd>
              </div>
            </dl>

            {quote.available ? (
              <Button asChild className="w-full" size="lg">
                <Link
                  href={buildCheckoutUrl(
                    vehicleId,
                    quote.pickupDate,
                    quote.returnDate,
                  )}
                >
                  <CalendarCheck2 aria-hidden="true" size={18} />
                  Continuar para checkout
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <Alert className="mt-5" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-primary-strong"
            size={16}
          />
          Nenhuma cobrança será realizada agora. O checkout revisa a
          solicitação; o pagamento acontece somente após a confirmação.
        </p>
      </div>
    </aside>
  );
}

function buildCheckoutUrl(
  vehicleId: string,
  pickupDate: string,
  returnDate: string,
): string {
  const query = new URLSearchParams({ pickupDate, returnDate, vehicleId });
  return `/checkout?${query}`;
}

function calculateDays(pickupDate: string, returnDate: string): number {
  if (!pickupDate || !returnDate) {
    return 0;
  }

  const pickup = Date.parse(`${pickupDate}T00:00:00Z`);
  const returnAt = Date.parse(`${returnDate}T00:00:00Z`);

  if (!Number.isFinite(pickup) || !Number.isFinite(returnAt)) {
    return 0;
  }

  return Math.max(0, Math.round((returnAt - pickup) / millisecondsPerDay));
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
