import type {
  HostAvailabilityBlock,
  HostBooking,
  HostDashboard,
  HostFinance,
  HostProfile,
  HostVehicle,
  HostVehicleInput,
  HostVehicleStatus,
  VehicleImageUpload,
} from './host.types';

export class HostUnauthorizedError extends Error {}

export function getHostDashboard(): Promise<HostDashboard> {
  return hostRequest<HostDashboard>('/api/v1/hosts/dashboard');
}

export function onboardHost(input: {
  acceptTerms: boolean;
  bio?: string;
  displayName: string;
  supportPhone?: string;
}): Promise<HostProfile> {
  return hostRequest<HostProfile>('/api/v1/hosts/onboarding', {
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

export function updateHostProfile(input: {
  bio?: string;
  displayName?: string;
  supportPhone?: string;
}): Promise<HostProfile> {
  return hostRequest<HostProfile>('/api/v1/hosts/profile', {
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
    method: 'PATCH',
  });
}

export function listHostVehicles(): Promise<HostVehicle[]> {
  return hostRequest<HostVehicle[]>('/api/v1/hosts/vehicles');
}

export function createHostVehicle(
  input: HostVehicleInput,
): Promise<HostVehicle> {
  return hostRequest<HostVehicle>('/api/v1/hosts/vehicles', {
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

export function updateHostVehicle(
  vehicleId: string,
  input: HostVehicleInput,
): Promise<HostVehicle> {
  return hostRequest<HostVehicle>(`/api/v1/hosts/vehicles/${vehicleId}`, {
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
    method: 'PATCH',
  });
}

export function updateHostVehicleStatus(
  vehicleId: string,
  status: HostVehicleStatus,
): Promise<HostVehicle> {
  return hostRequest<HostVehicle>(
    `/api/v1/hosts/vehicles/${vehicleId}/status`,
    {
      body: JSON.stringify({ status }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    },
  );
}

export async function uploadHostVehicleImage(
  vehicleId: string,
  file: File,
  altText?: string,
): Promise<HostVehicle> {
  const prepared = await hostRequest<VehicleImageUpload>(
    `/api/v1/hosts/vehicles/${vehicleId}/images/upload-url`,
    {
      body: JSON.stringify({
        altText,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );
  const uploadResponse = await fetch(prepared.uploadUrl, {
    body: file,
    headers: prepared.headers,
    method: 'PUT',
  });
  if (!uploadResponse.ok) {
    throw new Error('O storage recusou o envio da foto. Tente novamente.');
  }
  return hostRequest<HostVehicle>(
    `/api/v1/hosts/vehicles/${vehicleId}/images/complete`,
    {
      body: JSON.stringify({
        altText,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: prepared.storageKey,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );
}

export function setHostVehicleImageCover(
  vehicleId: string,
  imageId: string,
): Promise<HostVehicle> {
  return hostRequest<HostVehicle>(
    `/api/v1/hosts/vehicles/${vehicleId}/images/${imageId}/cover`,
    { method: 'PATCH' },
  );
}

export function reorderHostVehicleImages(
  vehicleId: string,
  imageIds: string[],
): Promise<HostVehicle> {
  return hostRequest<HostVehicle>(
    `/api/v1/hosts/vehicles/${vehicleId}/images/order`,
    {
      body: JSON.stringify({ imageIds }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    },
  );
}

export function deleteHostVehicleImage(
  vehicleId: string,
  imageId: string,
): Promise<HostVehicle> {
  return hostRequest<HostVehicle>(
    `/api/v1/hosts/vehicles/${vehicleId}/images/${imageId}`,
    { method: 'DELETE' },
  );
}

export function listHostBookings(): Promise<HostBooking[]> {
  return hostRequest<HostBooking[]>('/api/v1/hosts/bookings');
}

export function listAvailabilityBlocks(): Promise<HostAvailabilityBlock[]> {
  return hostRequest<HostAvailabilityBlock[]>(
    '/api/v1/hosts/availability-blocks',
  );
}

export function createAvailabilityBlock(input: {
  endDate: string;
  reason?: string;
  startDate: string;
  vehicleId: string;
}): Promise<HostAvailabilityBlock> {
  return hostRequest<HostAvailabilityBlock>(
    '/api/v1/hosts/availability-blocks',
    {
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  );
}

export async function deleteAvailabilityBlock(blockId: string): Promise<void> {
  await hostRequest<void>(`/api/v1/hosts/availability-blocks/${blockId}`, {
    method: 'DELETE',
  });
}

export function getHostFinance(): Promise<HostFinance> {
  return hostRequest<HostFinance>('/api/v1/hosts/finance');
}

async function hostRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (response.status === 401) {
    throw new HostUnauthorizedError('Sua sessão expirou. Entre novamente.');
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
    throw new Error(message || 'Não foi possível concluir a operação.');
  }
  return payload as T;
}
