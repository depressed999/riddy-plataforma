export type PaymentMethod = 'card' | 'pix';
export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'in_process'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'
  | 'error';

export type Payment = {
  amount: number;
  approvedAt: string | null;
  bookingId: string;
  cancelledAt: string | null;
  createdAt: string;
  currency: 'BRL';
  failureMessage: string | null;
  id: string;
  method: PaymentMethod;
  paymentMethodId: string;
  paymentTypeId: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixTicketUrl: string | null;
  providerPaymentId: string | null;
  refundedAt: string | null;
  status: PaymentStatus;
  statusDetail: string | null;
  updatedAt: string;
};

export type PaymentBooking = {
  id: string;
  pickupDate: string;
  renterEmail: string;
  returnDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalDays: number;
  totalPrice: number;
  vehicle: {
    city: string;
    id: string;
    make: string;
    model: string;
    state: string;
    year: number;
  };
};

export type PaymentContext = {
  booking: PaymentBooking;
  mercadoPago: {
    enabled: boolean;
    publicKey: string | null;
  };
  payment: Payment | null;
};

export type CreatePaymentInput = {
  bookingId: string;
  idempotencyKey: string;
  installments?: number;
  issuerId?: string;
  payerIdentification?: {
    number: string;
    type: string;
  };
  paymentMethodId: string;
  token?: string;
};

export type ProviderPayment = {
  approvedAt: string | null;
  id: string;
  paymentMethodId: string;
  paymentTypeId: string | null;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixTicketUrl: string | null;
  status: PaymentStatus;
  statusDetail: string | null;
};

export type ProviderPaymentInput = {
  amount: number;
  description: string;
  externalReference: string;
  idempotencyKey: string;
  installments?: number;
  issuerId?: string;
  method: PaymentMethod;
  payerEmail: string;
  payerIdentification?: {
    number: string;
    type: string;
  };
  paymentMethodId: string;
  token?: string;
};

export type PaymentAction = {
  id: string;
  paymentId: string;
  status: 'processing' | 'succeeded' | 'failed';
  type: 'cancel' | 'refund';
};
