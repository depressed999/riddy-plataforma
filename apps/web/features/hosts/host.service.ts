import type {
  HostAvailabilityBlock,
  HostBooking,
  HostDashboard,
  HostFinance,
  HostProfile,
  HostVehicle,
  HostVehicleInput,
  HostVehicleStatus,
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
