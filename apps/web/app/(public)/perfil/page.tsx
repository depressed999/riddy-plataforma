import type { Metadata } from 'next';

import { ProfilePageContent } from '@/features/profile/profile-page-content';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Meu perfil | Riddy',
};

export default function ProfilePage() {
  return <ProfilePageContent />;
}
