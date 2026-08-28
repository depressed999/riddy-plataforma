'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Loader2,
  MapPin,
  QrCode,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

import { Container } from '@/components/layout/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-provider';

import {
  cancelPayment,
  createPayment,
  getPaymentContext,
  PaymentUnauthorizedError,
  refundPayment,
} from './payments.service';
import type {
  CreatePaymentInput,
  Payment,
  PaymentContext,
  PaymentStatus,
} from './payments.types';

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
  PaymentStatus,
  {
    description: string;
    label: string;
    variant: 'default' | 'success' | 'warning';
  }
> = {
  approved: {
    description: 'O pagamento foi aprovado e a reserva está confirmada.',
    label: 'Aprovado',
    variant: 'success',
  },
  cancelled: {
    description: 'O pagamento pendente foi cancelado sem cobrança.',
    label: 'Cancelado',
    variant: 'default',
  },
  charged_back: {
    description: 'O pagamento foi contestado e a reserva foi cancelada.',
    label: 'Contestado',
    variant: 'warning',
  },
  created: {
    description: 'A tentativa está sendo preparada.',
    label: 'Criado',
    variant: 'warning',
  },
  error: {
    description:
      'O provedor não concluiu esta tentativa. Você pode tentar novamente.',
    label: 'Falha técnica',
    variant: 'warning',
  },
  in_process: {
    description: 'O Mercado Pago ainda está analisando o pagamento.',
    label: 'Em análise',
    variant: 'warning',
  },
  pending: {
    description: 'O pagamento aguarda uma ação do pagador.',
    label: 'Pendente',
    variant: 'warning',
  },
  refunded: {
    description: 'O valor foi devolvido pelo Mercado Pago.',
    label: 'Reembolsado',
    variant: 'default',
  },
  rejected: {
    description: 'O pagamento foi recusado. Revise os dados e tente novamente.',
    label: 'Recusado',
    variant: 'warning',
  },
};

export function PaymentPageContent({ bookingId }: { bookingId: string }) {
  const { isLoading: isSessionLoading, user } = useAuth();
  const router = useRouter();
  const [context, setContext] = useState<PaymentContext | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBrickReady, setIsBrickReady] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [action, setAction] = useState<'cancel' | 'refund' | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const loginPath = `/entrar?next=${encodeURIComponent(`/pagamentos/${bookingId}`)}`;

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }
    if (!user) {
      router.replace(loginPath);
      return;
    }

    let active = true;
    void getPaymentContext(bookingId)
      .then((response) => {
        if (active) {
          setContext(response);
          setError('');
        }
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof PaymentUnauthorizedError) {
          router.replace(loginPath);
          return;
        }
        if (active) {
          setError(messageFrom(caughtError));
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
  }, [bookingId, isSessionLoading, loginPath, router, user]);

  const payment = context?.payment ?? null;
  const canRenderBrick = Boolean(
    context?.mercadoPago.enabled &&
    context.mercadoPago.publicKey &&
    context.booking.status === 'pending' &&
    (!payment || ['error', 'rejected'].includes(payment.status)),
  );

  useEffect(() => {
    if (
      !canRenderBrick ||
      !isScriptReady ||
      !context?.mercadoPago.publicKey ||
      !window.MercadoPago
    ) {
      return;
    }

    let active = true;
    let controller: MercadoPagoBrickController | null = null;
    const containerId = `payment-brick-${bookingId}`;
    const mercadoPago = new window.MercadoPago(context.mercadoPago.publicKey, {
      locale: 'pt-BR',
    });

    void mercadoPago
      .bricks()
      .create('payment', containerId, {
        callbacks: {
          onError: (brickError: unknown) => {
            if (active) {
              setError(messageFrom(brickError));
            }
          },
          onReady: () => {
            if (active) {
              setIsBrickReady(true);
            }
          },
          onSubmit: async ({ formData }: { formData: unknown }) => {
            if (!active) {
              return;
            }
            setError('');
            setIsProcessing(true);
            idempotencyKey.current ??= crypto.randomUUID();

            try {
              const response = await createPayment(
                normalizeBrickPayment(
                  formData,
                  bookingId,
                  idempotencyKey.current,
                ),
              );
              if (active) {
                setContext((current) =>
                  current ? { ...current, payment: response } : current,
                );
                if (['error', 'rejected'].includes(response.status)) {
                  idempotencyKey.current = crypto.randomUUID();
                }
              }
            } catch (caughtError) {
              idempotencyKey.current = crypto.randomUUID();
              if (caughtError instanceof PaymentUnauthorizedError) {
                router.replace(loginPath);
                return;
              }
              if (active) {
                setError(messageFrom(caughtError));
              }
              throw caughtError;
            } finally {
              if (active) {
                setIsProcessing(false);
              }
            }
          },
        },
        customization: {
          paymentMethods: {
            bankTransfer: 'all',
            creditCard: 'all',
            debitCard: 'all',
            maxInstallments: 12,
            prepaidCard: 'all',
          },
          visual: { hideFormTitle: true },
        },
        initialization: {
          amount: context.booking.totalPrice,
          payer: { email: context.booking.renterEmail },
        },
      })
      .then((created) => {
        controller = created;
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(messageFrom(caughtError));
        }
      });

    return () => {
      active = false;
      void controller?.unmount();
    };
  }, [bookingId, canRenderBrick, context, isScriptReady, loginPath, router]);

  async function refreshContext(): Promise<void> {
    setIsLoading(true);
    setError('');
    try {
      setContext(await getPaymentContext(bookingId));
    } catch (caughtError) {
      if (caughtError instanceof PaymentUnauthorizedError) {
        router.replace(loginPath);
        return;
      }
      setError(messageFrom(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(): Promise<void> {
    if (!action || !payment) {
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      const response = await (action === 'cancel'
        ? cancelPayment(payment.id, crypto.randomUUID())
        : refundPayment(payment.id, crypto.randomUUID()));
      setContext((current) =>
        current
          ? {
              ...current,
              booking: { ...current.booking, status: 'cancelled' },
              payment: response,
            }
          : current,
      );
      setAction(null);
    } catch (caughtError) {
      if (caughtError instanceof PaymentUnauthorizedError) {
        router.replace(loginPath);
        return;
      }
      setError(messageFrom(caughtError));
      setAction(null);
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading || isSessionLoading || !user) {
    return <PaymentSkeleton />;
  }

  return (
    <Container className="py-7 sm:py-9 lg:py-12">
      {context?.mercadoPago.enabled ? (
        <Script
          id="mercado-pago-sdk"
          onError={() =>
            setError(
              'Não foi possível carregar o ambiente seguro de pagamento.',
            )
          }
          onReady={() => setIsScriptReady(true)}
          src="https://sdk.mercadopago.com/js/v2"
          strategy="afterInteractive"
        />
      ) : null}

      <Link
        className="inline-flex items-center gap-2 font-heading text-sm font-medium text-muted-foreground hover:text-foreground"
        href="/reservas"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Voltar às reservas
      </Link>

      <div className="mt-6">
        <p className="font-heading text-xs font-medium tracking-[0.12em] text-primary-strong uppercase">
          Pagamento seguro
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          Conclua o pagamento da reserva
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Escolha cartão ou Pix. Os dados financeiros são capturados diretamente
          pelo ambiente seguro do Mercado Pago.
        </p>
      </div>

      {error ? (
        <Alert className="mt-7" variant="destructive">
          <AlertTitle>Pagamento não concluído</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {context ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
          <div className="space-y-6">
            <BookingSummary context={context} />

            {!context.mercadoPago.enabled ? (
              <ConfigurationState />
            ) : context.booking.status !== 'pending' && !payment ? (
              <Alert variant="warning">
                <AlertTitle>Esta reserva não aceita pagamento</AlertTitle>
                <AlertDescription>
                  O status atual da reserva não permite iniciar uma nova
                  cobrança.
                </AlertDescription>
              </Alert>
            ) : payment && !['error', 'rejected'].includes(payment.status) ? (
              <PaymentResult
                onCancel={() => setAction('cancel')}
                onRefresh={() => void refreshContext()}
                onRefund={() => setAction('refund')}
                payment={payment}
              />
            ) : (
              <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-muted text-primary-strong">
                    <CreditCard aria-hidden="true" size={20} />
                  </span>
                  <div>
                    <h2 className="font-heading text-xl font-semibold">
                      Cartão ou Pix
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      A Riddy não recebe nem armazena o número do seu cartão.
                    </p>
                  </div>
                </div>

                {payment ? (
                  <Alert className="mt-5" variant="warning">
                    <AlertTitle>
                      {statusPresentation[payment.status].label}
                    </AlertTitle>
                    <AlertDescription>
                      {payment.failureMessage ||
                        statusPresentation[payment.status].description}
                    </AlertDescription>
                  </Alert>
                ) : null}

                {!isBrickReady ? <Skeleton className="mt-6 h-80" /> : null}
                <div
                  className={isBrickReady ? 'mt-6' : 'h-0 overflow-hidden'}
                  id={`payment-brick-${bookingId}`}
                />
                {isProcessing ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin"
                      size={17}
                    />
                    Enviando ao Mercado Pago com proteção contra duplicidade...
                  </p>
                ) : null}
              </section>
            )}
          </div>

          <SecuritySummary context={context} />
        </div>
      ) : (
        <div className="mt-7">
          <Button onClick={() => void refreshContext()} variant="secondary">
            Tentar novamente
          </Button>
        </div>
      )}

      <Dialog
        onOpenChange={(open) => !open && setAction(null)}
        open={Boolean(action)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'refund'
                ? 'Reembolsar o pagamento integralmente?'
                : 'Cancelar este pagamento pendente?'}
            </DialogTitle>
            <DialogDescription>
              {action === 'refund'
                ? 'O Mercado Pago devolverá o valor pelo meio original e a reserva será cancelada. O prazo depende do cartão ou da instituição financeira.'
                : 'Nenhum valor aprovado será cobrado e a reserva também será cancelada.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isProcessing} variant="secondary">
                Voltar
              </Button>
            </DialogClose>
            <Button
              disabled={isProcessing}
              onClick={() => void handleAction()}
              variant="destructive"
            >
              {isProcessing ? (
                <Loader2
                  aria-hidden="true"
                  className="animate-spin"
                  size={18}
                />
              ) : (
                <RotateCcw aria-hidden="true" size={18} />
              )}
              {action === 'refund'
                ? 'Confirmar reembolso'
                : 'Confirmar cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

function BookingSummary({ context }: { context: PaymentContext }) {
  const { booking } = context;
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-heading text-xs font-medium tracking-[0.12em] text-primary-strong uppercase">
            Reserva
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">
            {booking.vehicle.make} {booking.vehicle.model}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" size={15} />
            {booking.vehicle.city}, {booking.vehicle.state}
          </p>
        </div>
        <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>
          {booking.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
        </Badge>
      </div>

      <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
        <DataItem label="Retirada" value={formatDate(booking.pickupDate)} />
        <DataItem label="Devolução" value={formatDate(booking.returnDate)} />
        <DataItem
          label="Total"
          value={currencyFormatter.format(booking.totalPrice)}
        />
      </dl>
    </section>
  );
}

function PaymentResult({
  onCancel,
  onRefresh,
  onRefund,
  payment,
}: {
  onCancel(): void;
  onRefresh(): void;
  onRefund(): void;
  payment: Payment;
}) {
  const presentation = statusPresentation[payment.status];
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-primary-muted text-primary-strong">
            {payment.status === 'approved' ? (
              <CheckCircle2 aria-hidden="true" size={23} />
            ) : payment.status === 'cancelled' ||
              payment.status === 'refunded' ? (
              <XCircle aria-hidden="true" size={23} />
            ) : (
              <Clock3 aria-hidden="true" size={23} />
            )}
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">
              Status do pagamento
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              {presentation.description}
            </p>
          </div>
        </div>
        <Badge variant={presentation.variant}>{presentation.label}</Badge>
      </div>

      {payment.method === 'pix' && payment.status === 'pending' ? (
        <PixInstructions payment={payment} />
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
        {['pending', 'in_process'].includes(payment.status) ? (
          <Button onClick={onCancel} variant="destructive">
            Cancelar pagamento
          </Button>
        ) : null}
        {payment.status === 'approved' ? (
          <Button onClick={onRefund} variant="destructive">
            <RotateCcw aria-hidden="true" size={17} />
            Solicitar reembolso total
          </Button>
        ) : null}
        {['pending', 'in_process'].includes(payment.status) ? (
          <Button onClick={onRefresh} variant="secondary">
            <RefreshCw aria-hidden="true" size={17} />
            Atualizar status
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link href="/reservas">Ver minhas reservas</Link>
        </Button>
      </div>
    </section>
  );
}

function PixInstructions({ payment }: { payment: Payment }) {
  async function copyCode(): Promise<void> {
    if (payment.pixQrCode) {
      await navigator.clipboard.writeText(payment.pixQrCode);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-muted p-5">
      <div className="flex items-center gap-2">
        <QrCode aria-hidden="true" size={20} />
        <h3 className="font-heading font-semibold">Pague com Pix</h3>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
        {payment.pixQrCodeBase64 ? (
          <Image
            alt="QR Code Pix desta reserva"
            className="rounded-md bg-white p-2"
            height={180}
            src={`data:image/png;base64,${payment.pixQrCodeBase64}`}
            unoptimized
            width={180}
          />
        ) : (
          <div className="grid size-44 place-items-center rounded-md bg-card text-muted-foreground">
            <QrCode aria-hidden="true" size={44} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm leading-6 text-muted-foreground">
            Escaneie o código no aplicativo do seu banco ou copie o código
            abaixo.
          </p>
          {payment.pixQrCode ? (
            <>
              <p className="mt-3 truncate rounded-md border border-border bg-card p-3 font-mono text-xs">
                {payment.pixQrCode}
              </p>
              <Button
                className="mt-3"
                onClick={() => void copyCode()}
                size="sm"
              >
                <Copy aria-hidden="true" size={16} />
                Copiar código Pix
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SecuritySummary({ context }: { context: PaymentContext }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-xl border border-border border-t-4 border-t-primary bg-card p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="text-primary-strong"
            size={22}
          />
          <h2 className="font-heading text-xl font-semibold">
            Pagamento protegido
          </h2>
        </div>
        <ul className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
          <li className="flex items-start gap-2">
            <CreditCard
              aria-hidden="true"
              className="mt-1 shrink-0"
              size={16}
            />
            Cartões são tokenizados pelo Mercado Pago e não passam pelos
            servidores da Riddy.
          </li>
          <li className="flex items-start gap-2">
            <ReceiptText
              aria-hidden="true"
              className="mt-1 shrink-0"
              size={16}
            />
            O valor é conferido na reserva pelo backend:{' '}
            {currencyFormatter.format(context.booking.totalPrice)}.
          </li>
          <li className="flex items-start gap-2">
            <RefreshCw aria-hidden="true" className="mt-1 shrink-0" size={16} />
            Reenvios usam idempotência para evitar cobranças duplicadas.
          </li>
        </ul>
      </div>
    </aside>
  );
}

function ConfigurationState() {
  return (
    <Alert variant="warning">
      <AlertTitle>Mercado Pago aguardando credenciais</AlertTitle>
      <AlertDescription>
        Configure a Public Key e o Access Token de teste no ambiente para
        habilitar cartão e Pix. Nenhum formulário financeiro é exibido sem essas
        credenciais.
      </AlertDescription>
    </Alert>
  );
}

function PaymentSkeleton() {
  return (
    <Container className="py-10">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-7 h-24 max-w-2xl" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-[520px]" />
        </div>
        <Skeleton className="h-72" />
      </div>
    </Container>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-heading text-sm font-medium">{value}</dd>
    </div>
  );
}

function normalizeBrickPayment(
  value: unknown,
  bookingId: string,
  key: string,
): CreatePaymentInput {
  if (!value || typeof value !== 'object') {
    throw new Error('O formulário de pagamento retornou dados inválidos.');
  }
  const form = value as Record<string, unknown>;
  const paymentMethodId = requiredString(form, 'payment_method_id');
  const payer = objectValue(form.payer);
  const identification = objectValue(payer?.identification);

  return {
    bookingId,
    idempotencyKey: key,
    installments: optionalNumber(form.installments),
    issuerId: optionalString(form.issuer_id),
    payerIdentification:
      identification &&
      optionalString(identification.type) &&
      optionalString(identification.number)
        ? {
            number: requiredString(identification, 'number'),
            type: requiredString(identification, 'type'),
          }
        : undefined,
    paymentMethodId,
    token: optionalString(form.token),
  };
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function requiredString(object: Record<string, unknown>, key: string): string {
  const value = optionalString(object[key]);
  if (!value) {
    throw new Error(`O campo ${key} não foi retornado pelo Mercado Pago.`);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível processar o pagamento.';
}

type MercadoPagoBrickController = { unmount(): Promise<void> | void };

type MercadoPagoConstructor = new (
  publicKey: string,
  options?: { locale?: string },
) => {
  bricks(): {
    create(
      type: 'payment',
      containerId: string,
      settings: Record<string, unknown>,
    ): Promise<MercadoPagoBrickController>;
  };
};

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstructor;
  }
}
