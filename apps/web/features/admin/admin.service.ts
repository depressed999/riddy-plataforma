import type {
  AdminAudit,
  AdminBooking,
  AdminDashboard,
  AdminPage,
  AdminPayment,
  AdminUser,
  AdminVehicle,
} from './admin.types';

export function getAdminDashboard(): Promise<AdminDashboard> {
  return request('/api/v1/admin/dashboard');
}
export function listAdminUsers(search: string): Promise<AdminPage<AdminUser>> {
  return request(`/api/v1/admin/users?${search}`);
}
export function listAdminVehicles(
  search: string,
): Promise<AdminPage<AdminVehicle>> {
  return request(`/api/v1/admin/vehicles?${search}`);
}
export function listAdminBookings(
  search: string,
): Promise<AdminPage<AdminBooking>> {
  return request(`/api/v1/admin/bookings?${search}`);
}
export function listAdminPayments(
  search: string,
): Promise<AdminPage<AdminPayment>> {
  return request(`/api/v1/admin/payments?${search}`);
}
export function listAdminAudit(search: string): Promise<AdminPage<AdminAudit>> {
  return request(`/api/v1/admin/audit?${search}`);
}

export function updateAdminUserRole(
  id: string,
  role: AdminUser['role'],
  reason: string,
): Promise<AdminUser> {
  return request(`/api/v1/admin/users/${id}/role`, {
    body: JSON.stringify({ reason, role }),
    method: 'PATCH',
  });
}
export function updateAdminUserStatus(
  id: string,
  status: AdminUser['status'],
  reason: string,
): Promise<AdminUser> {
  return request(`/api/v1/admin/users/${id}/status`, {
    body: JSON.stringify({ reason, status }),
    method: 'PATCH',
  });
}
export function updateAdminVehicleStatus(
  id: string,
  status: AdminVehicle['status'],
  reason: string,
): Promise<AdminVehicle> {
  return request(`/api/v1/admin/vehicles/${id}/status`, {
    body: JSON.stringify({ reason, status }),
    method: 'PATCH',
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(' ')
          : String(payload.message)
        : 'Não foi possível concluir a solicitação administrativa.';
    throw new Error(message);
  }
  return payload as T;
}
