import type {
  KycCase,
  KycDocument,
  KycDocumentType,
  KycUploadIntent,
  ReviewKycCase,
} from './kyc.types';

export class KycUnauthorizedError extends Error {}

export async function getKycCase(): Promise<KycCase | null> {
  const response = await fetch('/api/v1/kyc', {
    credentials: 'include',
  });
  return parseResponse<KycCase | null>(response);
}

export async function uploadKycDocument(
  type: KycDocumentType,
  file: File,
): Promise<KycDocument> {
  const intent = await apiRequest<KycUploadIntent>(
    '/api/v1/kyc/documents/upload-url',
    {
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        type,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );

  const uploadResponse = await fetch(intent.uploadUrl, {
    body: file,
    headers: intent.headers,
    method: 'PUT',
  });
  if (!uploadResponse.ok) {
    throw new Error('O storage privado recusou o envio. Tente novamente.');
  }

  return apiRequest<KycDocument>(
    `/api/v1/kyc/documents/${intent.document.id}/complete`,
    { method: 'POST' },
  );
}

export async function deleteKycDocument(documentId: string): Promise<void> {
  await apiRequest<void>(`/api/v1/kyc/documents/${documentId}`, {
    method: 'DELETE',
  });
}

export function submitKycCase(): Promise<KycCase> {
  return apiRequest<KycCase>('/api/v1/kyc/submit', { method: 'POST' });
}

export async function openKycDocument(documentId: string): Promise<void> {
  const response = await apiRequest<{ expiresInSeconds: number; url: string }>(
    `/api/v1/kyc/documents/${documentId}/view-url`,
  );
  window.open(response.url, '_blank', 'noopener,noreferrer');
}

export function listPendingKycCases(): Promise<ReviewKycCase[]> {
  return apiRequest<ReviewKycCase[]>('/api/v1/kyc/review/cases');
}

export function approveKycCase(caseId: string): Promise<ReviewKycCase> {
  return apiRequest<ReviewKycCase>(
    `/api/v1/kyc/review/cases/${caseId}/approve`,
    { method: 'POST' },
  );
}

export function rejectKycCase(
  caseId: string,
  reason: string,
): Promise<ReviewKycCase> {
  return apiRequest<ReviewKycCase>(
    `/api/v1/kyc/review/cases/${caseId}/reject`,
    {
      body: JSON.stringify({ reason }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
  });
  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (response.status === 401) {
    throw new KycUnauthorizedError('Sua sessão expirou. Entre novamente.');
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
    throw new Error(message || 'Não foi possível concluir a verificação.');
  }
  return payload as T;
}
