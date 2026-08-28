'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center px-6 py-16">
      <div className="max-w-lg text-center" role="alert">
        <TriangleAlert
          aria-hidden="true"
          className="mx-auto text-warning"
          size={36}
        />
        <h1 className="mt-5 font-heading text-2xl font-semibold">
          Algo não saiu como esperado.
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          A falha foi registrada. Tente carregar esta parte novamente.
        </p>
        <Button className="mt-6" onClick={reset} type="button">
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
