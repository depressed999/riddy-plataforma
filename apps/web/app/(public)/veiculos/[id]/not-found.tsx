import { CarFront } from 'lucide-react';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function VehicleNotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        action={
          <Button asChild>
            <Link href="/buscar">Voltar ao catálogo</Link>
          </Button>
        }
        description="Ele pode ter sido removido, pausado ou o endereço informado não é válido."
        icon={CarFront}
        title="Veículo não encontrado"
      />
    </Container>
  );
}
