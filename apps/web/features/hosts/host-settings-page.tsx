'use client';

import { Loader2, Save, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useHost } from './host-provider';
import { updateHostProfile } from './host.service';
import {
  HostPageFrame,
  HostPageHeading,
  HostPageState,
  messageFrom,
} from './host-shared';

export function HostSettingsPage() {
  const { dashboard, refresh } = useHost();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const profile = dashboard?.profile;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateHostProfile({
        bio: String(formData.get('bio') ?? ''),
        displayName: String(formData.get('displayName') ?? ''),
        supportPhone: String(formData.get('supportPhone') ?? ''),
      });
      await refresh();
      setSuccess('Configurações atualizadas.');
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <HostPageState>
      <HostPageFrame>
        <HostPageHeading
          description="Atualize a identidade exibida no contexto dos seus anúncios."
          title="Configurações"
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="rounded-xl border border-border bg-card p-6 sm:p-8"
            onSubmit={handleSubmit}
          >
            {error ? (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert className="mb-6" variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-5">
              <Field label="Nome de exibição" name="displayName">
                <Input
                  defaultValue={profile?.displayName}
                  id="settings-displayName"
                  minLength={2}
                  name="displayName"
                  required
                />
              </Field>
              <Field label="Telefone de atendimento" name="supportPhone">
                <Input
                  defaultValue={profile?.supportPhone ?? ''}
                  id="settings-supportPhone"
                  name="supportPhone"
                  pattern="[+0-9() .-]{8,24}"
                  type="tel"
                />
              </Field>
              <Field label="Apresentação" name="bio">
                <Textarea
                  defaultValue={profile?.bio ?? ''}
                  id="settings-bio"
                  maxLength={500}
                  name="bio"
                />
              </Field>
              <div className="flex justify-end border-t border-border pt-6">
                <Button disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Save size={17} />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar configurações'}
                </Button>
              </div>
            </div>
          </form>
          <Card>
            <CardContent>
              <ShieldCheck className="text-primary-strong" size={24} />
              <h2 className="mt-4 font-heading text-lg font-semibold">
                Estado operacional
              </h2>
              <Badge
                className="mt-3"
                variant={profile?.status === 'active' ? 'success' : 'warning'}
              >
                {profile?.status === 'active'
                  ? 'Conta ativa'
                  : 'Aguardando verificação'}
              </Badge>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                A identidade, o e-mail e os documentos pessoais são gerenciados
                separadamente do perfil público de anfitrião.
              </p>
              <Button asChild className="mt-5 w-full" variant="secondary">
                <Link href="/perfil">Abrir perfil pessoal</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </HostPageFrame>
    </HostPageState>
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
        htmlFor={`settings-${name}`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
