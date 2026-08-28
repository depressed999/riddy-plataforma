'use client';

import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Loader2,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Container } from '@/components/layout/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/auth-provider';

import {
  approveKycCase,
  KycUnauthorizedError,
  listPendingKycCases,
  openKycDocument,
  rejectKycCase,
} from './kyc.service';
import type { KycDocumentType, ReviewKycCase } from './kyc.types';

const documentLabels: Record<KycDocumentType, string> = {
  drivers_license_back: 'CNH — verso',
  drivers_license_front: 'CNH — frente',
  proof_of_address: 'Comprovante de residência',
  selfie: 'Selfie',
};

const submittedDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function KycReviewPageContent() {
  const { isLoading: isSessionLoading, user } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<ReviewKycCase[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyCaseId, setBusyCaseId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const loadCases = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      setCases(await listPendingKycCases());
    } catch (caughtError) {
      if (caughtError instanceof KycUnauthorizedError) {
        router.replace('/entrar?next=/verificacoes/kyc');
        return;
      }
      setError(messageFrom(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }
    if (!user) {
      router.replace('/entrar?next=/verificacoes/kyc');
      return;
    }
    if (user.role === 'user') {
      return;
    }
    let active = true;
    void listPendingKycCases()
      .then((response) => {
        if (active) {
          setCases(response);
          setError('');
        }
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof KycUnauthorizedError) {
          router.replace('/entrar?next=/verificacoes/kyc');
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
  }, [isSessionLoading, router, user]);

  async function handleApprove(kycCase: ReviewKycCase): Promise<void> {
    setBusyCaseId(kycCase.id);
    setError('');
    setSuccess('');
    try {
      await approveKycCase(kycCase.id);
      setCases((current) => current.filter((item) => item.id !== kycCase.id));
      setSuccess(`A identidade de ${kycCase.user.name} foi aprovada.`);
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setBusyCaseId(null);
    }
  }

  async function handleReject(kycCase: ReviewKycCase): Promise<void> {
    const reason = reasons[kycCase.id]?.trim() ?? '';
    if (reason.length < 10) {
      setError('Informe um motivo de rejeição com pelo menos 10 caracteres.');
      return;
    }
    setBusyCaseId(kycCase.id);
    setError('');
    setSuccess('');
    try {
      await rejectKycCase(kycCase.id, reason);
      setCases((current) => current.filter((item) => item.id !== kycCase.id));
      setSuccess(
        `O reenvio de documentos foi solicitado a ${kycCase.user.name}.`,
      );
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setBusyCaseId(null);
    }
  }

  const isReviewer = user?.role === 'reviewer' || user?.role === 'admin';

  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <PageHeader
        actions={
          isReviewer ? (
            <Button
              disabled={isLoading}
              onClick={() => void loadCases()}
              variant="secondary"
            >
              <RefreshCw
                aria-hidden="true"
                className={isLoading ? 'animate-spin' : undefined}
                size={17}
              />
              Atualizar fila
            </Button>
          ) : undefined
        }
        description="Analise os documentos privados e registre uma decisão auditável."
        eyebrow="Operação protegida"
        title="Análises KYC"
      />

      {!isSessionLoading && user && !isReviewer ? (
        <Alert className="mt-8" variant="destructive">
          <ShieldAlert aria-hidden="true" size={19} />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Esta área está disponível somente para analistas e administradores.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert className="mt-6" variant="destructive">
          <AlertTitle>Não foi possível concluir</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="mt-6" variant="success">
          <AlertTitle>Decisão registrada</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {isSessionLoading || (isReviewer && isLoading) ? (
        <div className="mt-8 grid gap-5">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : isReviewer && cases.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-muted text-success">
              <ClipboardCheck aria-hidden="true" size={23} />
            </span>
            <h2 className="mt-4 font-heading text-xl font-semibold">
              Fila em dia
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Não há verificações aguardando análise neste momento.
            </p>
          </CardContent>
        </Card>
      ) : isReviewer ? (
        <div className="mt-8 grid gap-6">
          {cases.map((kycCase) => {
            const isBusy = busyCaseId === kycCase.id;
            return (
              <Card key={kycCase.id}>
                <CardContent>
                  <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-lg font-semibold">
                          {kycCase.user.name}
                        </h2>
                        <Badge variant="warning">Aguardando análise</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {kycCase.user.email}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enviado em{' '}
                      {kycCase.submittedAt
                        ? submittedDateFormatter.format(
                            new Date(kycCase.submittedAt),
                          )
                        : 'data indisponível'}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {kycCase.documents.map((document) => (
                      <Button
                        className="justify-start"
                        key={document.id}
                        onClick={() => void openKycDocument(document.id)}
                        variant="secondary"
                      >
                        <Eye aria-hidden="true" size={16} />
                        <span className="truncate">
                          {documentLabels[document.type]}
                        </span>
                      </Button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div>
                      <label
                        className="mb-1.5 block font-heading text-sm font-medium"
                        htmlFor={`rejection-${kycCase.id}`}
                      >
                        Motivo para solicitar reenvio
                      </label>
                      <Textarea
                        className="min-h-24"
                        disabled={isBusy}
                        id={`rejection-${kycCase.id}`}
                        maxLength={500}
                        onChange={(event) =>
                          setReasons((current) => ({
                            ...current,
                            [kycCase.id]: event.target.value,
                          }))
                        }
                        placeholder="Explique claramente o que precisa ser corrigido."
                        value={reasons[kycCase.id] ?? ''}
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        disabled={isBusy || Boolean(busyCaseId)}
                        onClick={() => void handleReject(kycCase)}
                        variant="secondary"
                      >
                        {isBusy ? (
                          <Loader2
                            aria-hidden="true"
                            className="animate-spin"
                            size={17}
                          />
                        ) : (
                          <XCircle aria-hidden="true" size={17} />
                        )}
                        Solicitar reenvio
                      </Button>
                      <Button
                        disabled={isBusy || Boolean(busyCaseId)}
                        onClick={() => void handleApprove(kycCase)}
                      >
                        {isBusy ? (
                          <Loader2
                            aria-hidden="true"
                            className="animate-spin"
                            size={17}
                          />
                        ) : (
                          <CheckCircle2 aria-hidden="true" size={17} />
                        )}
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </Container>
  );
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}
