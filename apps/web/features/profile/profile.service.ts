import type { ProfileChanges, UserProfile } from './profile.types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ProfileUnauthorizedError extends Error {}

export async function getProfile(): Promise<UserProfile> {
  const response = await fetch(`${apiUrl}/api/v1/profile`, {
    credentials: 'include',
  });

  return parseResponse<UserProfile>(response);
}

export async function updateProfile(
  changes: ProfileChanges,
): Promise<UserProfile> {
  const response = await fetch(`${apiUrl}/api/v1/profile`, {
    body: JSON.stringify(changes),
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    method: 'PATCH',
  });

  return parseResponse<UserProfile>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new ProfileUnauthorizedError('Sua sessão expirou. Entre novamente.');
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(' ')
          : typeof payload.message === 'string'
            ? payload.message
            : undefined
        : undefined;

    throw new Error(message || 'Não foi possível carregar o perfil.');
  }

  return payload as T;
}
