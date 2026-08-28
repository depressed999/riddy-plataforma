export type VehicleImage = {
  altText: string;
  id: string;
  isCover: boolean;
  sortOrder: number;
  storageKey: string;
};

export type VehicleLocation = {
  city: string;
  latitude: number;
  longitude: number;
  state: string;
};

export type VehicleStatus = 'active' | 'draft' | 'inactive' | 'maintenance';

export type VehicleType = 'car' | 'motorcycle';

export type VehicleSort = 'newest' | 'price_asc' | 'price_desc';

export type VehicleSearch = {
  fuelType?: string;
  location?: string;
  maxPrice?: number;
  minPrice?: number;
  page: number;
  pageSize: number;
  query?: string;
  seats?: number;
  sort: VehicleSort;
  transmission?: string;
  type?: VehicleType;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Vehicle = {
  amenities: string[];
  createdAt: string;
  dailyRate: number;
  description: string;
  fuelType: string;
  id: string;
  images: VehicleImage[];
  location: VehicleLocation;
  make: string;
  model: string;
  ownerId: string;
  seats: number;
  status: VehicleStatus;
  transmission: string;
  type: VehicleType;
  updatedAt: string;
  year: number;
};

export type PaginatedVehicles = {
  items: Vehicle[];
  meta: PaginationMeta;
};
