import type { Metadata } from 'next';

import { DesignSystemShowcase } from '@/components/design-system-showcase';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Design System | Riddy',
  description:
    'Biblioteca de componentes e tokens visuais da plataforma Riddy.',
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
