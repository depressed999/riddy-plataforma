export type AdminPage<T> = {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type AdminListQuery = {
  page: number;
  pageSize: number;
  query?: string;
  status?: string;
};

export type AdminUserRole = 'admin' | 'reviewer' | 'user';
export type AdminUserStatus = 'active' | 'suspended';
export type AdminVehicleStatus =
  'active' | 'draft' | 'inactive' | 'maintenance';
