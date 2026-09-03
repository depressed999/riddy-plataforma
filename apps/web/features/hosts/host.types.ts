export type HostProfileStatus = 'active' | 'onboarding' | 'suspended';
export type HostKycStatus =
  'approved' | 'draft' | 'not_started' | 'pending_review' | 'rejected';

export type HostProfile = {
  bio: string | null;
  createdAt: string;
  displayName: string;
  id: string;
  status: HostProfileStatus;
  supportPhone: string | null;
  termsAcceptedAt: string;
  updatedAt: string;
  userId: string;
};

export type HostDashboard = {
  kycStatus: HostKycStatus;
  metrics: {
    activeVehicles: number;
    approvedGross: number;
    confirmedBookings: number;
    currency: 'BRL';
    pendingBookings: number;
    totalVehicles: number;
  };
  profile: HostProfile | null;
};

export type HostVehicleStatus = 'active' | 'draft' | 'inactive' | 'maintenance';
export type HostVehicleType = 'car' | 'motorcycle';

export type HostVehicle = {
  amenities: string[];
  createdAt: string;
  dailyRate: number;
  description: string;
  fuelType: string;
  id: string;
  images: Array<{
    altText: string;
    id: string;
    isCover: boolean;
    sortOrder: number;
    storageKey: string;
  }>;
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
  status: HostVehicleStatus;
  transmission: string;
  type: HostVehicleType;
  updatedAt: string;
  year: number;
};

export type HostVehicleInput = {
  amenities: string[];
  city: string;
  dailyRate: number;
  description: string;
  fuelType: string;
  latitude: number;
  longitude: number;
  make: string;
  model: string;
  seats: number;
  state: string;
  transmission: string;
  type: HostVehicleType;
  year: number;
};

export type VehicleImageUpload = {
  expiresAt: string;
  headers: Record<string, string>;
  storageKey: string;
  uploadUrl: string;
};

export type HostBooking = {
  createdAt: string;
  currency: 'BRL';
  id: string;
  pickupDate: string;
  renter: { id: string; name: string };
  returnDate: string;
  status: 'cancelled' | 'completed' | 'confirmed' | 'pending';
  totalDays: number;
  totalPrice: number;
  vehicle: { id: string; make: string; model: string };
};

export type HostAvailabilityBlock = {
  createdAt: string;
  endDate: string;
  id: string;
  reason: string | null;
  startDate: string;
  updatedAt: string;
  vehicle: { id: string; make: string; model: string };
};

export type HostFinance = {
  approvedBookings: number;
  approvedGross: number;
  currency: 'BRL';
  pendingGross: number;
  refundedGross: number;
};
