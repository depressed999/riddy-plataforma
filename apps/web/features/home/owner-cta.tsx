import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function OwnerCta() {
  return (
    <Button asChild size="lg">
      <Link href="/anfitriao">
        Quero ser anfitrião
        <ArrowRight aria-hidden="true" size={18} />
      </Link>
    </Button>
  );
}
