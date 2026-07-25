import { apiRequest } from './client';
import type {
  Amenity,
  AmenityBooking,
  AmenityBookingAdmin,
  AvailabilityBooking,
} from './types';

export type AmenityInput = {
  name: string;
  description?: string;
  capacity: number;
  open_time: string;
  close_time: string;
  slot_minutes: number;
  is_active?: boolean;
};

export type BookingInput = {
  amenity_id: string;
  start_time: string;
  end_time: string;
  flat_id?: string;
};

export const amenitiesApi = {
  list: () => apiRequest<{ amenities: Amenity[] }>('/amenities'),

  get: (id: string) => apiRequest<{ amenity: Amenity }>(`/amenities/${id}`),

  availability: (id: string, from: string, to: string) =>
    apiRequest<{ bookings: AvailabilityBooking[] }>(`/amenities/${id}/availability`, {
      query: { from, to },
    }),

  /** Admin: upcoming bookings for an amenity, with booker + flat. */
  bookings: (id: string) =>
    apiRequest<{ bookings: AmenityBookingAdmin[] }>(`/amenities/${id}/bookings`),

  create: (input: AmenityInput) =>
    apiRequest<{ amenity: Amenity }>('/amenities', { method: 'POST', body: input }),

  update: (id: string, input: Partial<AmenityInput>) =>
    apiRequest<{ amenity: Amenity }>(`/amenities/${id}`, { method: 'PATCH', body: input }),
};

export const bookingsApi = {
  list: () => apiRequest<{ bookings: AmenityBooking[] }>('/bookings'),

  create: (input: BookingInput) =>
    apiRequest<{ booking: AmenityBooking }>('/bookings', { method: 'POST', body: input }),

  cancel: (id: string) => apiRequest<void>(`/bookings/${id}`, { method: 'DELETE' }),
};
