import { ArrowLeft, CalendarX2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { CheckoutPageContent } from '@/features/checkout/checkout-page-content';
import { getVehicle } from '@/features/marketplace/marketplace.service';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Checkout | Riddy',
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const vehicleId = scalar(params.vehicleId);
  const pickupDate = scalar(params.pickupDate);
  const returnDate = scalar(params.returnDate);

  if (
    !isUuid(vehicleId) ||
    !isDate(pickupDate) ||
    !isDate(returnDate) ||
    pickupDate >= returnDate
  ) {
    return <InvalidCheckout />;
  }

  const vehicle = await getVehicle(vehicleId);

  if (!vehicle) {
    return <InvalidCheckout />;
  }

  return (
    <CheckoutPageContent
      pickupDate={pickupDate}
      returnDate={returnDate}
      vehicle={vehicle}
    />
  );
}

function InvalidCheckout() {
  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-7 text-center sm:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-warning-muted text-warning">
          <CalendarX2 aria-hidden="true" size={26} />
        </div>
        <p className="mt-5 font-heading text-xs font-medium tracking-[0.12em] text-primary-strong uppercase">
          Checkout incompleto
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          Escolha o veículo e as datas novamente
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          O link não contém um período válido ou o veículo não está mais
          disponível no catálogo.
        </p>
        <Button asChild className="mt-7" size="lg">
          <Link href="/buscar">
            <ArrowLeft aria-hidden="true" size={18} />
            Voltar ao catálogo
          </Link>
        </Button>
      </div>
    </Container>
  );
}

function scalar(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
