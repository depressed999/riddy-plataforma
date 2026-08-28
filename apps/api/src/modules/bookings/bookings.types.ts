export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type BookingDates = {
  pickupDate: string;
  returnDate: string;
  vehicleId: string;
};

export type BookingQuote = BookingDates & {
  available: boolean;
  currency: 'BRL';
  dailyRate: number;
  totalDays: number;
  totalPrice: number;
};

export type BookingVehicle = {
  city: string;
  id: string;
  imageUrl: string | null;
  make: string;
  model: string;
  state: string;
  year: number;
};

export type Booking = {
  cancelledAt: string | null;
  createdAt: string;
  currency: 'BRL';
  dailyRate: number;
  id: string;
  pickupDate: string;
  renterId: string;
  returnDate: string;
  status: BookingStatus;
  totalDays: number;
  totalPrice: number;
  updatedAt: string;
  vehicle: BookingVehicle;
};

export type CreateBookingRecord = BookingDates & {
  dailyRate: number;
  renterId: string;
  totalDays: number;
  totalPrice: number;
};

export type BookableVehicle = {
  dailyRate: number;
  id: string;
  ownerId: string;
};
