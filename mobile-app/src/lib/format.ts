import type { Tone } from '@/components';
import type { VisitorStatus, VisitorType } from '@/api/types';

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** 12-hour clock, always with minutes: "1:00 am", "8:30 pm". */
function clock(d: Date): string {
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = d.getHours() >= 12 ? 'pm' : 'am';
  let hour = d.getHours() % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minutes} ${ampm}`;
}

/** Relative label: "Today, 8:00 pm" · "Yesterday, 9:00 am" · "23 Jul, 1:00 pm". */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = clock(d);
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.getDate()} ${d.toLocaleString(undefined, { month: 'short' })}, ${time}`;
}

const VISITOR_STATUS: Record<VisitorStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  expired: { label: 'Expired', tone: 'neutral' },
  checked_in: { label: 'Inside', tone: 'info' },
  checked_out: { label: 'Left', tone: 'neutral' },
};

export function visitorStatusMeta(status: VisitorStatus) {
  return VISITOR_STATUS[status];
}

const VISITOR_TYPE: Record<VisitorType, { label: string; icon: string }> = {
  guest: { label: 'Guest', icon: 'person-outline' },
  delivery: { label: 'Delivery', icon: 'cube-outline' },
  cab: { label: 'Cab', icon: 'car-outline' },
  service: { label: 'Service', icon: 'construct-outline' },
};

export function visitorTypeMeta(type: VisitorType) {
  return VISITOR_TYPE[type];
}

export function flatLabel(flat?: { number: string; tower?: { name: string } | null } | null): string {
  if (!flat) return '—';
  return flat.tower?.name ? `${flat.tower.name} · ${flat.number}` : flat.number;
}
