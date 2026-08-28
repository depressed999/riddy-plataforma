export const jobsQueueName = 'riddy-jobs';

export const jobNames = {
  authCleanup: 'maintenance.auth-cleanup',
  passwordRecovery: 'auth.password-recovery',
} as const;

export type PasswordRecoveryJobData = {
  email: string;
  resetUrl: string;
};

export type AuthCleanupJobResult = {
  expiredResetTokens: number;
  expiredSessions: number;
};
