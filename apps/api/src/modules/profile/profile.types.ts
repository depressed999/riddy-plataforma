export type UserProfile = {
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  createdAt: string;
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  phone: string | null;
  state: string | null;
  updatedAt: string;
};

export type ProfileChanges = Partial<{
  bio: string | null;
  city: string | null;
  name: string;
  phone: string | null;
  state: string | null;
}>;
