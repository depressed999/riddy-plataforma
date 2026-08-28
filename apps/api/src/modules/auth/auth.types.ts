export type PublicUser = {
  avatarUrl: string | null;
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  role: 'admin' | 'reviewer' | 'user';
};

export type AuthenticatedSession = {
  expiresAt: Date;
  token: string;
  user: PublicUser;
};

export type GoogleAuthorization = {
  state: string;
  url: string;
  verifier: string;
};

export type RecoveryRequestResult = {
  developmentResetToken?: string;
  message: string;
};

export type GoogleProfile = {
  email: string;
  id: string;
  name: string;
  picture: string | null;
};
