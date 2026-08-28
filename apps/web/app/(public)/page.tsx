import {
  BadgeCheck,
  CalendarCheck2,
  Headphones,
  KeyRound,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OwnerCta } from '@/features/home/owner-cta';
import { SearchForm } from '@/features/home/search-form';
import { MarketplaceVehicleCard } from '@/features/marketplace/marketplace-vehicle-card';
import { searchVehicles } from '@/features/marketplace/marketplace.service';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export const dynamic = 'force-dynamic';

const trustSignals = [
  { icon: ShieldCheck, label: 'Proteção em todas as reservas' },
  { icon: BadgeCheck, label: 'Proprietários verificados' },
  { icon: Headphones, label: 'Suporte quando precisar' },
];

const steps = [
  {
    description:
      'Busque por localização e data para encontrar o veículo ideal para a sua necessidade.',
    icon: Search,
    number: '01',
    title: 'Encontre o veículo perfeito',
  },
  {
    description:
      'Compare as opções e confirme sua escolha em um processo claro e protegido.',
    icon: CalendarCheck2,
    number: '02',
    title: 'Reserve com segurança',
  },
  {
    description:
      'Combine a retirada, faça a vistoria e aproveite o caminho com tranquilidade.',
    icon: KeyRound,
    number: '03',
    title: 'Pegue a chave e dirija',
  },
];

const trustBenefits = [
  {
    description:
      'Perfis e informações passam por verificações antes da primeira locação.',
    icon: BadgeCheck,
    title: 'Comunidade verificada',
  },
  {
    description:
      'Condições e valores ficam visíveis antes de você confirmar qualquer reserva.',
    icon: WalletCards,
    title: 'Preços transparentes',
  },
  {
    description:
      'Orientação para locatários e proprietários durante toda a jornada.',
    icon: Headphones,
    title: 'Suporte de verdade',
  },
];

export default async function Home() {
  const featuredVehicles = await getFeaturedVehicles();

  return (
    <>
      <section className="scroll-mt-20" id="alugar">
        <Container className="flex flex-col items-center py-16 text-center sm:py-20 lg:py-24">
          <Badge variant="outline">
            <Sparkles aria-hidden="true" className="mr-1.5" size={14} />
            Mobilidade entre pessoas
          </Badge>
          <h1 className="mt-6 max-w-5xl font-heading text-4xl leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-5xl sm:leading-[1.12] lg:text-6xl">
            Aluguel de carros e motos, sem complicações.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Encontre veículos de proprietários locais verificados. Reserve em
            poucos minutos e siga o seu caminho com tranquilidade.
          </p>

          <div className="mt-9 w-full sm:mt-10">
            <SearchForm />
          </div>

          <div className="mt-8 w-full max-w-5xl border-t border-border pt-7">
            <p className="font-heading text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Confiança em cada etapa
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {trustSignals.map(({ icon: Icon, label }) => (
                <div
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                  key={label}
                >
                  <Icon
                    aria-hidden="true"
                    className="text-primary-strong"
                    size={18}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section
        className="scroll-mt-20 border-y border-border bg-card py-14 sm:py-16 lg:py-20"
        id="veiculos-em-destaque"
      >
        <Container>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-heading text-xs font-medium tracking-[0.14em] text-primary-strong uppercase">
                Escolhas bem avaliadas
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                Veículos em destaque
              </h2>
            </div>
            <div className="sm:text-right">
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                Opções reais do catálogo para começar a sua busca.
              </p>
              <Button asChild className="mt-3" size="sm" variant="secondary">
                <Link href="/buscar">Ver todo o catálogo</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredVehicles.map((vehicle) => (
              <MarketplaceVehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </Container>
      </section>

      <section className="scroll-mt-20 py-16 sm:py-20" id="como-funciona">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-xs font-medium tracking-[0.14em] text-primary-strong uppercase">
              Simples do início ao fim
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Como funciona
            </h2>
            <p className="mt-3 text-muted-foreground">
              Três passos claros para pegar a estrada.
            </p>
          </div>

          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(({ description, icon: Icon, number, title }) => (
              <li className="text-center" key={number}>
                <div className="relative mx-auto grid size-16 place-items-center rounded-lg border border-border bg-card">
                  <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
                  <span className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-primary font-heading text-[11px] font-semibold text-primary-foreground">
                    {number}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold">
                  {title}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-y border-border bg-card py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-heading text-xs font-medium tracking-[0.14em] text-primary-strong uppercase">
              Feito para dar confiança
            </p>
            <h2 className="mt-2 max-w-xl font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Mobilidade com clareza para os dois lados.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              A Riddy aproxima locatários e proprietários com regras simples,
              informações objetivas e apoio nos momentos importantes.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {trustBenefits.map(({ description, icon: Icon, title }) => (
              <article className="bg-background p-6" key={title}>
                <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Icon aria-hidden="true" size={19} />
                </span>
                <h3 className="mt-4 font-heading font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="scroll-mt-20 py-16 sm:py-20" id="proprietarios">
        <Container>
          <div className="grid gap-8 rounded-lg border border-border border-t-4 border-t-primary bg-card p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div>
              <p className="font-heading text-xs font-medium tracking-[0.14em] text-primary-strong uppercase">
                Para proprietários
              </p>
              <h2 className="mt-2 max-w-2xl font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                Seu veículo pode abrir novos caminhos.
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                Disponibilize seu carro ou sua moto nos períodos livres e tenha
                controle sobre disponibilidade, valores e reservas.
              </p>
            </div>
            <OwnerCta />
          </div>
        </Container>
      </section>
    </>
  );
}

async function getFeaturedVehicles() {
  try {
    const result = await searchVehicles({ sort: 'newest' }, 3);
    return result.items;
  } catch {
    return [];
  }
}
