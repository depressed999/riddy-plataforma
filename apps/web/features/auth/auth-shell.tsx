import { ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Container } from '@/components/layout/container';

export function AuthShell({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="py-10 sm:py-14 lg:py-18">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative flex flex-col justify-between overflow-hidden bg-foreground p-7 text-background sm:p-10">
            <div>
              <Link
                aria-label="Riddy — página inicial"
                className="mb-8 inline-flex items-center gap-2.5"
                href="/"
              >
                <Image
                  alt="Riddy"
                  className="size-11 rounded-lg object-contain"
                  height={44}
                  src="/riddy-logo-icon.png"
                  width={44}
                />
              </Link>

              <p className="font-heading text-xs font-medium tracking-[0.14em] text-primary uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-md leading-7 text-background/70">
                {description}
              </p>
            </div>

            <div className="mt-10 flex items-start gap-3 border-t border-background/15 pt-6 text-sm leading-6 text-background/70">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-primary"
                size={20}
              />
              Seus dados estão protegidos com criptografia de ponta a ponta
            </div>

            {/* Logo decorativa de fundo */}
            <Image
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -bottom-8 size-48 object-contain opacity-[0.06]"
              height={192}
              src="/riddy-logo-icon.png"
              width={192}
            />
          </div>

          <div className="p-7 sm:p-10 lg:p-12">{children}</div>
        </div>
      </Container>
    </section>
  );
}
