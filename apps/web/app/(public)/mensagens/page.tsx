import type { Metadata } from 'next';

import { MessagesPageContent } from '@/features/messages/messages-page-content';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Mensagens | Riddy',
};

export default function MessagesPage() {
  return <MessagesPageContent />;
}
