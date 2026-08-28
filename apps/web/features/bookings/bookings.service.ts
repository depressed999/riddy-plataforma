import type { Booking, BookingDates, BookingQuote } from './bookings.types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class BookingUnauthorizedError extends Error {}

export async function getBookingQuote(
  dates: BookingDates,
): Promise<BookingQuote> {
  const query = new URLSearchParams(dates);
  const response = await fetch(`${apiUrl}/api/v1/bookings/quote?${query}`);

  return parseResponse<BookingQuote>(response);
}

export async function createBooking(dates: BookingDates): Promise<Booking> {
  const response = await fetch(`${apiUrl}/api/v1/bookings`, {
    body: JSON.stringify(dates),
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  return parseResponse<Booking>(response);
}

export async function getMyBookings(): Promise<Booking[]> {
  const response = await fetch(`${apiUrl}/api/v1/bookings/mine`, {
    credentials: 'include',
  });

  return parseResponse<Booking[]>(response);
}

export async function cancelBooking(id: string): Promise<Booking> {
  const response = await fetch(`${apiUrl}/api/v1/bookings/${id}/cancel`, {
    credentials: 'include',
    method: 'PATCH',
  });

  return parseResponse<Booking>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new BookingUnauthorizedError('Sua sessão expirou. Entre novamente.');
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

    throw new Error(message || 'Não foi possível processar a reserva.');
  }

  return payload as T;
}
