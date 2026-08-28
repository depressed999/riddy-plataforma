import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10',
        className,
      )}
      {...props}
    />
  );
}
