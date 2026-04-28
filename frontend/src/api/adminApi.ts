import { apiFetch } from "@/api/http";
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

export async function getAdminRefund(status = "PENDING") {
  const qs = new URLSearchParams({ status }).toString();
  return apiFetch<Booking[]>(`/admin/refund?${qs}`, { auth: true });
}

export async function patchAdminRefundAction(bookingId: number, body: { action: "APPROVE" | "REJECT"; note?: string }) {
  return apiFetch<Booking>(`/admin/refund/${bookingId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

