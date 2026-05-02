import { apiFetch, apiFetchBlob } from "@/api/http";
import type { Booking } from "@/api/bookingApi";

export type AdminMetrics = {
  pendingAktif: number;
  lunasHariIni: number;
  selesaiHariIni: number;
};

export type NotificationLog = {
  id: number;
  bookingId: number | null;
  channel: string;
  templateKey: string | null;
  notificationType: string;
  recipientType: string;
  recipientValue: string | null;
  message: string;
  createdAt: string;
};

export type AuditLog = {
  id: number;
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string | null;
  createdAt: string;
};

export async function getAdminMetrics() {
  return apiFetch<AdminMetrics>("/admin/metrics", { auth: true });
}

export async function getAdminBookingRange(start: string, end: string) {
  const qs = new URLSearchParams({ start, end }).toString();
  return apiFetch<Booking[]>(`/admin/booking?${qs}`, { auth: true });
}

export async function getAdminNotificationLog(limit = 50) {
  const qs = new URLSearchParams({ limit: String(limit) }).toString();
  return apiFetch<NotificationLog[]>(`/admin/notification-log?${qs}`, { auth: true });
}

export async function getAdminAuditLog(limit = 50) {
  const qs = new URLSearchParams({ limit: String(limit) }).toString();
  return apiFetch<AuditLog[]>(`/admin/audit-log?${qs}`, { auth: true });
}

export async function downloadAdminBookingCsv(start: string, end: string) {
  const qs = new URLSearchParams({ start, end }).toString();
  return apiFetchBlob(`/admin/export/booking.csv?${qs}`, { auth: true, accept: "text/csv" });
}

