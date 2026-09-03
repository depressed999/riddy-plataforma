import type {
  Vehicle,
  VehicleImage,
  VehicleStatus,
  VehicleType,
} from '../vehicles/vehicles.types';

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

export type HostMetrics = {
  activeVehicles: number;
  approvedGross: number;
  confirmedBookings: number;
  currency: 'BRL';
  pendingBookings: number;
  totalVehicles: number;
};

export type HostDashboard = {
  kycStatus: HostKycStatus;
  metrics: HostMetrics;
  profile: HostProfile | null;
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
  type: VehicleType;
  year: number;
};

export type HostVehicleUpdate = Partial<HostVehicleInput>;

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

export type HostVehicleStatusInput = {
  status: VehicleStatus;
};

export type HostVehicle = Vehicle;

export type VehicleImageUploadInput = {
  altText?: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
};

export type VehicleImageUpload = {
  expiresAt: string;
  headers: Record<string, string>;
  storageKey: string;
  uploadUrl: string;
};

export type VehicleImageCompletion = {
  altText?: string;
  mimeType: VehicleImageUploadInput['mimeType'];
  sizeBytes: number;
  storageKey: string;
};

export type HostVehicleImage = VehicleImage;
