import { CarFront } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type RiddyLogoProps = {
  className?: string;
  compact?: boolean;
};

export function RiddyLogo({ className, compact = false }: RiddyLogoProps) {
  return (
    <Link
      aria-label="Riddy — página inicial"
      className={cn(
        'inline-flex min-h-11 items-center gap-2 font-heading text-xl font-semibold tracking-[-0.01em] text-foreground',
        className,
      )}
      href="/"
    >
      <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
        <CarFront aria-hidden="true" size={20} strokeWidth={1.8} />
      </span>
      {compact ? <span className="sr-only">Riddy</span> : <span>Riddy</span>}
    </Link>
  );
}
