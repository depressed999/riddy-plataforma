import Image from 'next/image';
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
      <Image
        alt="Riddy"
        className="h-20 w-auto object-contain"
        height={40}
        priority
        src="/riddy-logo-icon.png"
        width={140}
      />

      {compact ? <span className="sr-only"></span> : <span>Riddy</span>}
    </Link>
  );
}
