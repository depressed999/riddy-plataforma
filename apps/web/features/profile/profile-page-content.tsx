'use client';

import {
  CalendarDays,
  FileCheck2,
  Loader2,
  LockKeyhole,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Container } from '@/components/layout/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/auth-provider';

import {
  getProfile,
  ProfileUnauthorizedError,
  updateProfile,
} from './profile.service';
import type { UserProfile } from './profile.types';

const memberDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

export function ProfilePageContent() {
  const { isLoading: isSessionLoading, refresh, user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (!user) {
      router.replace('/entrar?next=/perfil');
      return;
    }

    let active = true;

    void getProfile()
      .then((response) => {
        if (active) {
          setProfile(response);
          setError('');
        }
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof ProfileUnauthorizedError) {
          router.replace('/entrar?next=/perfil');
          return;
        }

        if (active) {
          setError('Não foi possível carregar seu perfil. Tente novamente.');
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

  const completion = useMemo(() => calculateCompletion(profile), [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);

    try {
      const updatedProfile = await updateProfile({
        bio: String(formData.get('bio') ?? ''),
        city: String(formData.get('city') ?? ''),
        name: String(formData.get('name') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        state: String(formData.get('state') ?? ''),
      });
      setProfile(updatedProfile);
      await refresh().catch(() => undefined);
      setSuccess('Suas informações foram atualizadas.');
    } catch (caughtError) {
      if (caughtError instanceof ProfileUnauthorizedError) {
        router.replace('/entrar?next=/perfil');
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível salvar seu perfil.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <PageHeader
        description="Mantenha suas informações básicas atualizadas para preparar sua experiência na Riddy."
        eyebrow="Sua conta"
        title="Meu perfil"
      />

      {error && !profile ? (
        <Alert className="mt-8" variant="destructive">
          <AlertTitle>Perfil indisponível</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading || isSessionLoading ? (
        <ProfileSkeleton />
      ) : profile ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <ProfileSummary completion={completion} profile={profile} />

          <section
            aria-labelledby="profile-data-title"
            className="rounded-xl border border-border bg-card p-6 sm:p-8"
          >
            <div>
              <p className="font-heading text-xs font-medium tracking-[0.12em] text-primary-strong uppercase">
                Informações públicas básicas
              </p>
              <h2
                className="mt-1 font-heading text-2xl font-semibold"
                id="profile-data-title"
              >
                Seus dados
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Somente nome, cidade e apresentação poderão aparecer em áreas
                públicas futuras.
              </p>
            </div>

            {error ? (
              <Alert className="mt-6" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert className="mt-6" variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <ProfileField label="Nome" name="name">
                  <Input
                    autoComplete="name"
                    defaultValue={profile.name}
                    id="profile-name"
                    minLength={2}
                    name="name"
                    required
                  />
                </ProfileField>
                <ProfileField label="Telefone" name="phone">
                  <Input
                    autoComplete="tel"
                    defaultValue={profile.phone ?? ''}
                    id="profile-phone"
                    inputMode="tel"
                    name="phone"
                    pattern="[+0-9() .-]{8,24}"
                    placeholder="+55 (92) 99999-9999"
                    type="tel"
                  />
                </ProfileField>
              </div>

              <ProfileField
                description="A alteração de e-mail exigirá um fluxo de verificação específico."
                label="E-mail da conta"
                name="email"
              >
                <Input
                  className="bg-muted"
                  id="profile-email"
                  readOnly
                  value={profile.email}
                />
              </ProfileField>

              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_110px]">
                <ProfileField label="Cidade" name="city">
                  <Input
                    autoComplete="address-level2"
                    defaultValue={profile.city ?? ''}
                    id="profile-city"
                    maxLength={120}
                    name="city"
                    placeholder="Manaus"
                  />
                </ProfileField>
                <ProfileField label="Estado" name="state">
                  <Input
                    autoComplete="address-level1"
                    className="uppercase"
                    defaultValue={profile.state ?? ''}
                    id="profile-state"
                    maxLength={2}
                    name="state"
                    pattern="[A-Za-z]{2}"
                    placeholder="AM"
                  />
                </ProfileField>
              </div>

              <ProfileField
                description="Até 500 caracteres. Não informe documentos ou dados financeiros."
                label="Sobre você"
                name="bio"
              >
                <Textarea
                  defaultValue={profile.bio ?? ''}
                  id="profile-bio"
                  maxLength={500}
                  name="bio"
                  placeholder="Conte brevemente como você pretende usar a Riddy."
                />
              </ProfileField>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs leading-5 text-muted-foreground">
                  <LockKeyhole aria-hidden="true" size={15} />
                  Dados sensíveis não fazem parte deste formulário.
                </p>
                <Button disabled={isSaving} size="lg">
                  {isSaving ? (
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin"
                      size={18}
                    />
                  ) : null}
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </Container>
  );
}

function ProfileSummary({
  completion,
  profile,
}: {
  completion: number;
  profile: UserProfile;
}) {
  return (
    <aside className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto flex size-24 items-center justify-center rounded-full border-4 border-primary/30 bg-foreground font-heading text-3xl font-semibold text-background">
          {initials(profile.name)}
        </div>
        <h2 className="mt-4 font-heading text-xl font-semibold">
          {profile.name}
        </h2>
        <p className="mt-1 break-all text-sm text-muted-foreground">
          {profile.email}
        </p>
        <Badge
          className="mt-3"
          variant={profile.emailVerified ? 'success' : 'warning'}
        >
          {profile.emailVerified ? 'E-mail verificado' : 'Verificação pendente'}
        </Badge>

        <div className="mt-6 border-t border-border pt-5 text-left">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-heading font-medium">Perfil preenchido</span>
            <span className="text-muted-foreground">{completion}%</span>
          </div>
          <div
            aria-label={`Perfil ${completion}% preenchido`}
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary-strong"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-heading font-semibold">Resumo da conta</h3>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CalendarDays aria-hidden="true" className="mt-0.5" size={17} />
            Membro desde{' '}
            {memberDateFormatter.format(new Date(profile.createdAt))}
          </li>
          <li className="flex items-start gap-2">
            <MapPin aria-hidden="true" className="mt-0.5" size={17} />
            {profile.city && profile.state
              ? `${profile.city}, ${profile.state}`
              : 'Localização ainda não informada'}
          </li>
          <li className="flex items-start gap-2">
            <FileCheck2 aria-hidden="true" className="mt-0.5" size={17} />
            Documentos de identidade em uma área privada e protegida.
          </li>
        </ul>
        <Button asChild className="mt-5 w-full" variant="secondary">
          <Link href="/perfil/documentos">
            <ShieldCheck aria-hidden="true" size={17} />
            Verificar identidade
          </Link>
        </Button>
      </section>
    </aside>
  );
}

function ProfileField({
  children,
  description,
  label,
  name,
}: {
  children: ReactNode;
  description?: string;
  label: string;
  name: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block font-heading text-sm font-medium"
        htmlFor={`profile-${name}`}
      >
        {label}
      </label>
      {children}
      {description ? (
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Skeleton className="h-96" />
      <Skeleton className="h-[680px]" />
    </div>
  );
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'US'
  );
}

function calculateCompletion(profile: UserProfile | null): number {
  if (!profile) {
    return 0;
  }

  const fields = [
    profile.name,
    profile.phone,
    profile.city,
    profile.state,
    profile.bio,
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}
