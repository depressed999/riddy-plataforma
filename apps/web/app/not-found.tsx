import { SearchX } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-6 py-16">
      <div className="max-w-lg text-center">
        <SearchX
          aria-hidden="true"
          className="mx-auto text-muted-foreground"
          size={38}
        />
        <h1 className="mt-5 font-heading text-2xl font-semibold">
          Página não encontrada.
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          O endereço pode ter mudado ou não estar mais disponível.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </main>
  );
}
