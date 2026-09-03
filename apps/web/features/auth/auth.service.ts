import type { AuthResponse, MessageResponse } from './auth.types';

export const googleAuthUrl = '/api/v1/auth/google';
export const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

export async function getCurrentUser(): Promise<AuthResponse | null> {
  const response = await fetch('/api/v1/auth/me', {
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  return parseResponse<AuthResponse>(response);
}

export function register(input: {
  email: string;
  name: string;
  password: string;
}): Promise<AuthResponse> {
  return post<AuthResponse>('/api/v1/auth/register', input);
}

export function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return post<AuthResponse>('/api/v1/auth/login', input);
}

export function logout(): Promise<MessageResponse> {
  return post<MessageResponse>('/api/v1/auth/logout', {});
}

export function requestPasswordRecovery(
  email: string,
): Promise<MessageResponse> {
  return post<MessageResponse>('/api/v1/auth/recovery/request', { email });
}

export function confirmPasswordRecovery(input: {
  password: string;
  token: string;
}): Promise<MessageResponse> {
  return post<MessageResponse>('/api/v1/auth/recovery/confirm', input);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(' ')
          : typeof payload.message === 'string'
            ? payload.message
            : undefined
        : undefined;

    throw new Error(message || 'Não foi possível concluir a solicitação.');
  }

  return payload as T;
}
