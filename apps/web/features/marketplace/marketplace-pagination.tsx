import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { MarketplaceSearchParams } from './marketplace.types';
import { createMarketplaceHref } from './marketplace.utils';

export function MarketplacePagination({
  filters,
  page,
  totalPages,
}: {
  filters: MarketplaceSearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-10 flex items-center justify-center gap-1"
    >
      <PaginationLink
        disabled={page === 1}
        href={createMarketplaceHref(filters, { page: String(page - 1) })}
        label="Página anterior"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </PaginationLink>

      {pages.map((item) => (
        <Link
          aria-current={item === page ? 'page' : undefined}
          aria-label={`Página ${item}`}
          className={
            item === page
              ? 'grid size-11 place-items-center rounded-md border border-primary bg-primary font-heading text-sm font-semibold'
              : 'grid size-11 place-items-center rounded-md border border-transparent font-heading text-sm font-medium hover:border-border hover:bg-card'
          }
          href={createMarketplaceHref(filters, { page: String(item) })}
          key={item}
        >
          {item}
        </Link>
      ))}

      <PaginationLink
        disabled={page === totalPages}
        href={createMarketplaceHref(filters, { page: String(page + 1) })}
        label="Próxima página"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  children,
  disabled,
  href,
  label,
}: {
  children: ReactNode;
  disabled: boolean;
  href: string;
  label: string;
}) {
  const className =
    'grid size-11 place-items-center rounded-md border border-border bg-card transition-colors hover:bg-muted';

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} opacity-40`}>
        {children}
      </span>
    );
  }

  return (
    <Link aria-label={label} className={className} href={href}>
      {children}
    </Link>
  );
}
