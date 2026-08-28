export type AuthUser = {
  avatarUrl: string | null;
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  role: 'admin' | 'reviewer' | 'user';
};

export type AuthResponse = {
  user: AuthUser;
};

export type MessageResponse = {
  developmentResetToken?: string;
  message: string;
};
