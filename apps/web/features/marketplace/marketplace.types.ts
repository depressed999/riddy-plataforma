export type VehicleType = 'car' | 'motorcycle';
export type VehicleSort = 'newest' | 'price_asc' | 'price_desc';

export type MarketplaceSearchParams = {
  fuelType?: string;
  location?: string;
  maxPrice?: string;
  minPrice?: string;
  page?: string;
  pickupDate?: string;
  query?: string;
  returnDate?: string;
  seats?: string;
  sort?: VehicleSort;
  transmission?: string;
  type?: VehicleType;
};

export type VehicleImage = {
  altText: string;
  id: string;
  isCover: boolean;
  sortOrder: number;
  storageKey: string;
};

export type Vehicle = {
  amenities: string[];
  createdAt: string;
  dailyRate: number;
  description: string;
  fuelType: string;
  id: string;
  images: VehicleImage[];
  location: {
    city: string;
    latitude: number;
    longitude: number;
    state: string;
  };
  make: string;
  model: string;
  ownerId: string;
  seats: number;
  status: 'active' | 'draft' | 'inactive' | 'maintenance';
  transmission: string;
  type: VehicleType;
  updatedAt: string;
  year: number;
};

export type PaginatedVehicles = {
  items: Vehicle[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
