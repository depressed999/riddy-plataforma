import type { Metadata } from 'next';

import { MessagesPageContent } from '@/features/messages/messages-page-content';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Conversa | Riddy',
};

export default async function ConversationPage(
  props: PageProps<'/mensagens/[id]'>,
) {
  const { id } = await props.params;
  return <MessagesPageContent initialConversationId={id} />;
}
