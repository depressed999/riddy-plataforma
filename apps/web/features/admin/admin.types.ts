export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
export type AdminPage<T> = { items: T[]; meta: PageMeta };

export type AdminDashboard = {
  bookings: { confirmed: number; pending: number; total: number };
  kyc: { pending: number };
  messages: { conversations: number; total: number };
  payments: { approvedAmount: number; pending: number; total: number };
  users: { active: number; suspended: number; total: number };
  vehicles: { active: number; total: number };
};

export type AdminUser = {
  createdAt: string;
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  role: 'admin' | 'reviewer' | 'user';
  status: 'active' | 'suspended';
  suspendedAt: string | null;
  suspensionReason: string | null;
};

export type AdminVehicle = {
  city: string;
  createdAt: string;
  dailyRate: string;
  id: string;
  make: string;
  model: string;
  ownerEmail: string;
  ownerId: string;
  ownerName: string;
  state: string;
  status: 'active' | 'draft' | 'inactive' | 'maintenance';
  year: number;
};

export type AdminBooking = {
  createdAt: string;
  id: string;
  pickupDate: string;
  renterEmail: string;
  renterName: string;
  returnDate: string;
  status: string;
  totalPrice: string;
  vehicleId: string;
  vehicleName: string;
};

export type AdminPayment = {
  amount: string;
  bookingId: string;
  createdAt: string;
  currency: string;
  id: string;
  method: string;
  payerEmail: string;
  providerPaymentId: string | null;
  status: string;
  vehicleName: string;
};

export type AdminAudit = {
  action: string;
  actorEmail: string;
  actorName: string;
  createdAt: string;
  id: string;
  metadata: Record<string, string | number | boolean | null>;
  reason: string;
  targetId: string | null;
  targetType: string;
};
