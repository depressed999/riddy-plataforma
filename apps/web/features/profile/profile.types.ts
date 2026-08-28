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

export type ProfileChanges = {
  bio: string;
  city: string;
  name: string;
  phone: string;
  state: string;
};
