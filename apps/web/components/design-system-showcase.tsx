'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Inbox,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  type LucideIcon,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const accountMenuItems: Array<{ icon: LucideIcon; label: string }> = [
  { icon: UserRound, label: 'Meu perfil' },
  { icon: Bell, label: 'Notificações' },
  { icon: Settings, label: 'Configurações' },
];

function Section({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="border-t border-border pt-8">
      <div className="mb-6 max-w-2xl">
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export function DesignSystemShowcase() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-primary font-heading text-sm font-semibold text-primary-foreground">
              R
            </span>
            <div>
              <p className="font-heading text-sm font-semibold">Riddy UI</p>
              <p className="text-xs text-muted-foreground">
                Design System v0.1
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/">
              <ArrowLeft aria-hidden="true" size={16} />
              Voltar
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageHeader
          actions={<Badge variant="primary">Etapa 2</Badge>}
          description="Biblioteca funcional baseada nos tokens de confiança, simplicidade e profissionalismo definidos para a Riddy."
          eyebrow="Fundamentos de interface"
          title="Componentes essenciais"
        />

        <Section
          description="Ações usam ciano com texto escuro; alternativas permanecem neutras e previsíveis."
          title="Botões e badges"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button>Continuar</Button>
            <Button variant="secondary">Ver detalhes</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button disabled>
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={16}
              />
              Processando
            </Button>
            <Button aria-label="Mais opções" size="icon" variant="secondary">
              <MoreHorizontal aria-hidden="true" size={18} />
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge>Novo</Badge>
            <Badge variant="primary">Selecionado</Badge>
            <Badge variant="success">Aprovado</Badge>
            <Badge variant="warning">Pendente</Badge>
            <Badge variant="outline">Rascunho</Badge>
          </div>
        </Section>

        <Section
          description="Campos com labels visíveis, foco ciano e feedback de erro associado."
          title="Formulários"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="font-heading text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                htmlFor="pickup-location"
              >
                Local de retirada
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  className="pl-11"
                  id="pickup-location"
                  placeholder="Cidade, aeroporto ou endereço"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                className="font-heading text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                htmlFor="vehicle-type"
              >
                Tipo de veículo
              </label>
              <Select defaultValue="car">
                <SelectTrigger id="vehicle-type">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Carro</SelectItem>
                  <SelectItem value="motorcycle">Motocicleta</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                className="font-heading text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                htmlFor="email-invalid"
              >
                E-mail
              </label>
              <Input
                aria-describedby="email-error"
                aria-invalid="true"
                defaultValue="email-incompleto"
                id="email-invalid"
              />
              <p className="text-sm text-destructive" id="email-error">
                Informe um endereço de e-mail válido.
              </p>
            </div>
            <div className="space-y-2">
              <label
                className="font-heading text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                htmlFor="disabled-field"
              >
                Campo indisponível
              </label>
              <Input
                disabled
                id="disabled-field"
                value="Aguardando verificação"
              />
            </div>
          </div>
        </Section>

        <Section
          description="Conteúdo agrupado por bordas leves, sem sombras decorativas."
          title="Cards e estados"
        >
          <div className="grid gap-5 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Reserva confirmada</CardTitle>
                <CardDescription>
                  Toyota Corolla Hybrid • 24–27 de agosto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="mt-1 font-heading font-semibold">R$ 840</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="mt-1">
                      <Badge variant="success">Confirmada</Badge>
                    </dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="secondary">
                  Ver reserva
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Carregando veículo</CardTitle>
                <CardDescription>
                  Skeleton para conteúdo assíncrono.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>

            <EmptyState
              action={<Button size="sm">Explorar veículos</Button>}
              className="min-h-full"
              description="Salve veículos interessantes para comparar e reservar depois."
              icon={Inbox}
              title="Nenhum favorito ainda"
            />
          </div>
        </Section>

        <Section
          description="Mensagens comunicam o que aconteceu e indicam a próxima ação."
          title="Alertas"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Alert variant="success">
              <CheckCircle2 aria-hidden="true" className="mb-2" size={18} />
              <AlertTitle>Documento aprovado</AlertTitle>
              <AlertDescription>
                Sua CNH foi validada e a reserva pode continuar.
              </AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTriangle aria-hidden="true" className="mb-2" size={18} />
              <AlertTitle>Ação necessária</AlertTitle>
              <AlertDescription>
                Envie o verso da CNH para concluir a verificação.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <CircleAlert aria-hidden="true" className="mb-2" size={18} />
              <AlertTitle>Pagamento não concluído</AlertTitle>
              <AlertDescription>
                Revise os dados do cartão ou escolha outra forma de pagamento.
              </AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section
          description="Overlays usam Radix para foco, teclado e leitura por tecnologias assistivas."
          title="Dialogs, sheets e menus"
        >
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Abrir dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar reserva?</DialogTitle>
                  <DialogDescription>
                    Verifique as condições de cancelamento antes de continuar.
                    Esta ação não poderá ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary">Manter reserva</Button>
                  <Button variant="destructive">Cancelar reserva</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">
                  <Menu aria-hidden="true" size={17} />
                  Abrir sheet
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu da conta</SheetTitle>
                  <SheetDescription>
                    Acesse rapidamente as áreas principais da Riddy.
                  </SheetDescription>
                </SheetHeader>
                <nav
                  className="mt-8 grid gap-1"
                  aria-label="Menu de demonstração"
                >
                  {accountMenuItems.map(({ icon: Icon, label }) => (
                    <button
                      className="flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm transition-colors hover:bg-muted"
                      key={label}
                      type="button"
                    >
                      <Icon aria-hidden="true" size={18} />
                      {label}
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  Mais ações
                  <ChevronDown aria-hidden="true" size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Ações da reserva</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                <DropdownMenuItem>Enviar mensagem</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Solicitar cancelamento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Section>
      </div>
    </main>
  );
}
