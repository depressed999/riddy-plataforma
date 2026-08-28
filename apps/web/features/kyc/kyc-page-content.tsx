'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileImage,
  Loader2,
  LockKeyhole,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';

import { Container } from '@/components/layout/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-provider';

import {
  deleteKycDocument,
  getKycCase,
  KycUnauthorizedError,
  openKycDocument,
  submitKycCase,
  uploadKycDocument,
} from './kyc.service';
import type {
  KycCase,
  KycDocument,
  KycDocumentStatus,
  KycDocumentType,
} from './kyc.types';

const documentDefinitions: Array<{
  description: string;
  label: string;
  required: boolean;
  type: KycDocumentType;
}> = [
  {
    description: 'Fotografe toda a frente da sua CNH, sem cortes ou reflexos.',
    label: 'CNH — frente',
    required: true,
    type: 'drivers_license_front',
  },
  {
    description: 'Envie o verso legível do mesmo documento.',
    label: 'CNH — verso',
    required: true,
    type: 'drivers_license_back',
  },
  {
    description: 'Uma foto recente, com o rosto centralizado e bem iluminado.',
    label: 'Selfie',
    required: true,
    type: 'selfie',
  },
  {
    description:
      'Conta de consumo ou documento equivalente emitido recentemente.',
    label: 'Comprovante de residência',
    required: false,
    type: 'proof_of_address',
  },
];

const requiredTypes = documentDefinitions
  .filter((definition) => definition.required)
  .map((definition) => definition.type);

export function KycPageContent() {
  const { isLoading: isSessionLoading, user } = useAuth();
  const router = useRouter();
  const [kycCase, setKycCase] = useState<KycCase | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyType, setBusyType] = useState<KycDocumentType | null>(null);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }
    if (!user) {
      router.replace('/entrar?next=/perfil/documentos');
      return;
    }
    let active = true;
    void getKycCase()
      .then((response) => {
        if (active) {
          setKycCase(response);
          setError('');
        }
      })
      .catch((caughtError: unknown) => {
        if (!handleSessionError(caughtError, router) && active) {
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

  const progress = useMemo(() => {
    const completed = requiredTypes.filter((type) => {
      const document = findDocument(kycCase, type);
      return document && document.status !== 'upload_pending';
    }).length;
    return Math.round((completed / requiredTypes.length) * 100);
  }, [kycCase]);

  const canSubmit =
    requiredTypes.every(
      (type) => findDocument(kycCase, type)?.status === 'uploaded',
    ) && kycCase?.status !== 'pending_review';
  const isLocked =
    kycCase?.status === 'pending_review' || kycCase?.status === 'approved';

  async function refreshCase(): Promise<void> {
    setKycCase(await getKycCase());
  }

  async function handleFile(
    type: KycDocumentType,
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setError('');
    setSuccess('');
    setBusyType(type);
    try {
      await uploadKycDocument(type, file);
      await refreshCase();
      setSuccess('Documento enviado e validado no storage privado.');
    } catch (caughtError) {
      if (handleSessionError(caughtError, router)) {
        return;
      }
      setError(messageFrom(caughtError));
    } finally {
      setBusyType(null);
    }
  }

  async function handleDelete(document: KycDocument): Promise<void> {
    if (!window.confirm(`Remover ${document.originalName}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    setBusyType(document.type);
    try {
      await deleteKycDocument(document.id);
      await refreshCase();
      setSuccess('Documento removido.');
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setBusyType(null);
    }
  }

  async function handleSubmit(): Promise<void> {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      setKycCase(await submitKycCase());
      setSuccess('Documentos enviados para análise.');
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <PageHeader
        actions={
          <Button asChild variant="secondary">
            <Link href="/perfil">
              <ArrowLeft aria-hidden="true" size={17} />
              Voltar ao perfil
            </Link>
          </Button>
        }
        description="Envie seus documentos por um canal protegido e acompanhe a análise da sua identidade."
        eyebrow="Segurança da conta"
        title="Documentos e verificação"
      />

      {error ? (
        <Alert className="mt-6" variant="destructive">
          <AlertTitle>Não foi possível concluir</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="mt-6" variant="success">
          <AlertTitle>Operação concluída</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading || isSessionLoading ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Skeleton className="h-72" />
          <Skeleton className="h-[640px]" />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <KycStatusCard kycCase={kycCase} progress={progress} />
            <Card>
              <CardContent>
                <div className="flex items-start gap-3">
                  <LockKeyhole
                    aria-hidden="true"
                    className="mt-0.5 text-primary-strong"
                    size={20}
                  />
                  <div>
                    <h3 className="font-heading font-semibold">
                      Arquivos privados
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      O acesso usa links temporários. Seus documentos não ficam
                      em páginas públicas da Riddy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-3 border-b border-border pb-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  Documentos da verificação
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Formatos aceitos: JPEG, PNG ou PDF, com até 8 MB.
                </p>
              </div>
              <Badge variant={isLocked ? 'warning' : 'outline'}>
                {isLocked ? 'Envio bloqueado durante análise' : 'Envio seguro'}
              </Badge>
            </div>

            {kycCase?.status === 'rejected' && kycCase.rejectionReason ? (
              <Alert className="mt-6" variant="warning">
                <AlertTitle>Reenvio solicitado</AlertTitle>
                <AlertDescription>{kycCase.rejectionReason}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-6 grid gap-4">
              {documentDefinitions.map((definition) => (
                <DocumentCard
                  busy={busyType === definition.type}
                  definition={definition}
                  disabled={Boolean(
                    isLocked || (busyType && busyType !== definition.type),
                  )}
                  document={findDocument(kycCase, definition.type)}
                  key={definition.type}
                  onDelete={handleDelete}
                  onFile={handleFile}
                  onView={openKycDocument}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Ao enviar para análise, os documentos ficam bloqueados até a
                decisão do analista.
              </p>
              <Button
                disabled={!canSubmit || isSubmitting || Boolean(busyType)}
                onClick={() => void handleSubmit()}
                size="lg"
              >
                {isSubmitting ? (
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <Send aria-hidden="true" size={18} />
                )}
                {isSubmitting ? 'Enviando...' : 'Enviar para análise'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </Container>
  );
}

function DocumentCard({
  busy,
  definition,
  disabled,
  document,
  onDelete,
  onFile,
  onView,
}: {
  busy: boolean;
  definition: (typeof documentDefinitions)[number];
  disabled: boolean;
  document: KycDocument | null;
  onDelete(document: KycDocument): Promise<void>;
  onFile(
    type: KycDocumentType,
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void>;
  onView(documentId: string): Promise<void>;
}) {
  return (
    <article className="grid gap-4 rounded-lg border border-border bg-background p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-muted text-primary-strong">
          {document ? (
            <FileCheck2 aria-hidden="true" size={21} />
          ) : (
            <FileImage aria-hidden="true" size={21} />
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading font-semibold">{definition.label}</h3>
            <Badge variant={definition.required ? 'primary' : 'outline'}>
              {definition.required ? 'Obrigatório' : 'Opcional'}
            </Badge>
            {document ? <DocumentStatus status={document.status} /> : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {definition.description}
          </p>
          {document ? (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {document.originalName} · {formatBytes(document.sizeBytes)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:justify-end">
        {document && document.status !== 'upload_pending' ? (
          <Button
            onClick={() => void onView(document.id)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Eye aria-hidden="true" size={16} />
            Visualizar
          </Button>
        ) : null}
        {document && !disabled ? (
          <Button
            aria-label={`Remover ${definition.label}`}
            onClick={() => void onDelete(document)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" size={17} />
          </Button>
        ) : null}
        {!disabled ? (
          <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card px-3 font-heading text-xs font-medium transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
            {busy ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={16} />
            ) : (
              <UploadCloud aria-hidden="true" size={16} />
            )}
            {busy ? 'Enviando...' : document ? 'Substituir' : 'Selecionar'}
            <input
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              className="sr-only"
              disabled={busy}
              onChange={(event) => void onFile(definition.type, event)}
              type="file"
            />
          </label>
        ) : null}
      </div>
    </article>
  );
}

function KycStatusCard({
  kycCase,
  progress,
}: {
  kycCase: KycCase | null;
  progress: number;
}) {
  const status = kycCase?.status ?? 'draft';
  const content = {
    approved: {
      description: 'Sua identidade foi verificada.',
      icon: CheckCircle2,
      label: 'Aprovado',
      variant: 'success' as const,
    },
    draft: {
      description: 'Conclua os documentos obrigatórios.',
      icon: ShieldCheck,
      label: 'Em preenchimento',
      variant: 'outline' as const,
    },
    pending_review: {
      description: 'Seus documentos estão sendo analisados.',
      icon: Clock3,
      label: 'Em análise',
      variant: 'warning' as const,
    },
    rejected: {
      description: 'Revise o motivo e envie novamente.',
      icon: UploadCloud,
      label: 'Reenvio necessário',
      variant: 'warning' as const,
    },
  }[status];
  const Icon = content.icon;

  return (
    <Card>
      <CardContent>
        <span className="grid size-11 place-items-center rounded-md bg-primary/20 text-primary-strong">
          <Icon aria-hidden="true" size={21} />
        </span>
        <h2 className="mt-4 font-heading text-lg font-semibold">
          Verificação de identidade
        </h2>
        <Badge className="mt-3" variant={content.variant}>
          {content.label}
        </Badge>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {content.description}
        </p>
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex justify-between text-sm">
            <span className="font-heading font-medium">Documentos</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div
            aria-label={`Documentos ${progress}% concluídos`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary-strong"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentStatus({ status }: { status: KycDocumentStatus }) {
  const labels: Record<KycDocumentStatus, string> = {
    approved: 'Aprovado',
    pending_review: 'Em análise',
    rejected: 'Rejeitado',
    upload_pending: 'Upload incompleto',
    uploaded: 'Pronto',
  };
  const variant =
    status === 'approved' || status === 'uploaded'
      ? 'success'
      : status === 'pending_review' || status === 'rejected'
        ? 'warning'
        : 'outline';
  return <Badge variant={variant}>{labels[status]}</Badge>;
}

function findDocument(
  kycCase: KycCase | null,
  type: KycDocumentType,
): KycDocument | null {
  return kycCase?.documents.find((document) => document.type === type) ?? null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}

function handleSessionError(
  error: unknown,
  router: ReturnType<typeof useRouter>,
): boolean {
  if (error instanceof KycUnauthorizedError) {
    router.replace('/entrar?next=/perfil/documentos');
    return true;
  }
  return false;
}
