import type { Amenity, AvailabilityBooking } from '@/api/types';

export type Slot = { start: Date; end: Date };

function parseHM(hm: string): [number, number] {
  const [h, m] = hm.split(':').map(Number);
  return [h || 0, m || 0];
}

/** Builds a Date from a "YYYY-MM-DD" day and "HH:MM" time, in local time. */
function at(dateStr: string, time: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = parseHM(time);
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

/** Generates the bookable slots for an amenity on a given day (local time). */
export function generateSlots(dateStr: string, amenity: Amenity): Slot[] {
  const dayEnd = at(dateStr, amenity.close_time);
  const step = amenity.slot_minutes * 60_000;
  const slots: Slot[] = [];
  let cur = at(dateStr, amenity.open_time);
  while (cur < dayEnd) {
    const next = new Date(cur.getTime() + step);
    if (next > dayEnd) break;
    slots.push({ start: new Date(cur), end: next });
    cur = next;
  }
  return slots;
}

/** How many booked reservations overlap a slot. */
export function bookedCount(slot: Slot, bookings: AvailabilityBooking[]): number {
  return bookings.filter(
    (b) => new Date(b.start_time) < slot.end && new Date(b.end_time) > slot.start
  ).length;
}

/** Next `count` days as "YYYY-MM-DD" starting today (local). */
export function upcomingDays(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }
  return out;
}

/** Short chip label for a day: "Today" / "Wed 6". */
export function dayChipLabel(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${d}`;
}
