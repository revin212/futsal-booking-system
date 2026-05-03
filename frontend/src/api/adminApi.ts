import { apiFetch, apiFetchBlob } from "@/api/http";
import type { Booking } from "@/api/bookingApi";
import type { LapanganListItem } from "@/api/lapanganApi";

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
  deliveryStatus?: string | null;
  errorMessage?: string | null;
  providerResponse?: string | null;
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

export type KalenderEvent = {
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: Record<string, unknown>;
};

export type FinanceSummaryRow = {
  key: string;
  count: number;
  totalHarga: number;
  adminFee: number;
  paidAmount: number;
};

export type FinanceReport = {
  totalRevenue: number;
  totalBookings: number;
  avgOccupancyPercent: number;
  revenuePerLapangan: { lapanganNama: string; bookings: number; revenue: number; jamBooked: number }[];
  peakHourHeatmap: { dayOfWeek: number; hour: number; count: number }[];
  topCustomers: { namaLengkap: string; noWhatsapp: string; totalPaid: number }[];
};

export type UserAdmin = {
  id: string;
  email: string;
  namaLengkap: string;
  noHp: string | null;
  fotoProfil: string | null;
  createdAt: string;
  isBlocked: boolean;
  role: string;
};

export async function getAdminMetrics() {
  return apiFetch<AdminMetrics>("/admin/metrics", { auth: true });
}

export type AdminBookingRangeParams = {
  start: string;
  end: string;
  status?: string;
  lapanganId?: number;
  q?: string;
};

export async function getAdminBookingRange(params: AdminBookingRangeParams) {
  const qs = new URLSearchParams({ start: params.start, end: params.end });
  if (params.status) qs.set("status", params.status);
  if (params.lapanganId != null) qs.set("lapanganId", String(params.lapanganId));
  if (params.q) qs.set("q", params.q);
  return apiFetch<Booking[]>(`/admin/booking?${qs}`, { auth: true });
}

export async function patchAdminRescheduleBooking(
  id: number,
  body: { tanggalMain: string; jamMulai: string; durasiJam: number }
) {
  return apiFetch<Booking>(`/admin/booking/${id}/reschedule`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function patchAdminCancelBooking(id: number, alasan: string) {
  return apiFetch<Booking>(`/admin/booking/${id}/cancel`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ alasan }),
  });
}

export async function getAdminNotificationLog(params?: {
  limit?: number;
  notificationType?: string;
  recipientType?: string;
  from?: string;
  to?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.notificationType) qs.set("notificationType", params.notificationType);
  if (params?.recipientType) qs.set("recipientType", params.recipientType);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<NotificationLog[]>(`/admin/notification-log${suffix}`, { auth: true });
}

export async function postAdminNotificationResend(logId: number) {
  return apiFetch<NotificationLog>(`/admin/notification-log/${logId}/resend`, { method: "POST", auth: true });
}

export async function getAdminAuditLog(params?: {
  limit?: number;
  action?: string;
  entityType?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.action) qs.set("action", params.action);
  if (params?.entityType) qs.set("entityType", params.entityType);
  if (params?.actorUserId) qs.set("actorUserId", params.actorUserId);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<AuditLog[]>(`/admin/audit-log${suffix}`, { auth: true });
}

export async function downloadAdminBookingCsv(start: string, end: string) {
  const qs = new URLSearchParams({ start, end }).toString();
  return apiFetchBlob(`/admin/export/booking.csv?${qs}`, { auth: true, accept: "text/csv" });
}

export async function getAdminKalender(lapanganId: number, start: string, end: string) {
  const qs = new URLSearchParams({ lapanganId: String(lapanganId), start, end }).toString();
  return apiFetch<KalenderEvent[]>(`/admin/kalender?${qs}`, { auth: true });
}

export async function getAdminFinanceSummary(start: string, end: string, groupBy: "DATE" | "METODE" | "LAPANGAN") {
  const qs = new URLSearchParams({ start, end, groupBy }).toString();
  return apiFetch<FinanceSummaryRow[]>(`/admin/keuangan/summary?${qs}`, { auth: true });
}

export async function getAdminFinanceInvoices(start: string, end: string) {
  const qs = new URLSearchParams({ start, end }).toString();
  return apiFetch<Booking[]>(`/admin/keuangan/invoice?${qs}`, { auth: true });
}

export async function getAdminFinanceReport(start: string, end: string) {
  const qs = new URLSearchParams({ start, end }).toString();
  return apiFetch<FinanceReport>(`/admin/keuangan/report?${qs}`, { auth: true });
}

export async function getAdminLapanganList() {
  return apiFetch<LapanganListItem[]>("/admin/lapangan", { auth: true });
}

export async function postAdminLapangan(body: Record<string, unknown>) {
  return apiFetch<LapanganListItem>("/admin/lapangan", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function putAdminLapangan(id: number, body: Record<string, unknown>) {
  return apiFetch<LapanganListItem>(`/admin/lapangan/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function deleteAdminLapangan(id: number) {
  return apiFetch<void>(`/admin/lapangan/${id}`, { method: "DELETE", auth: true });
}

export async function getAdminLapanganFotos(lapanganId: number) {
  return apiFetch<{ id: number; filePath: string; isUtama: boolean }[]>(`/admin/lapangan/${lapanganId}/foto`, { auth: true });
}

export async function postAdminLapanganFoto(lapanganId: number, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch<{ id: number; filePath: string; isUtama: boolean }>(`/admin/lapangan/${lapanganId}/foto`, {
    method: "POST",
    auth: true,
    body: fd,
  });
}

export async function patchAdminLapanganFotoUtama(lapanganId: number, fotoId: number) {
  return apiFetch<void>(`/admin/lapangan/${lapanganId}/foto/${fotoId}/utama`, { method: "PATCH", auth: true });
}

export async function deleteAdminLapanganFoto(lapanganId: number, fotoId: number) {
  return apiFetch<void>(`/admin/lapangan/${lapanganId}/foto/${fotoId}`, { method: "DELETE", auth: true });
}

export type JamOpRow = { id: number; hariKe: number; jamBuka: string; jamTutup: string; isAktif: boolean };

export async function getAdminLapanganJam(lapanganId: number) {
  return apiFetch<JamOpRow[]>(`/admin/lapangan/${lapanganId}/jam-operasional`, { auth: true });
}

export async function putAdminLapanganJam(
  lapanganId: number,
  items: { hariKe: number; jamBuka: string; jamTutup: string; isAktif: boolean }[]
) {
  return apiFetch<JamOpRow[]>(`/admin/lapangan/${lapanganId}/jam-operasional`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ items }),
  });
}

export type MetodePembayaranAdmin = {
  id: number;
  kode: string;
  namaLabel: string;
  adminFee: number;
  urutan: number;
  aktif: boolean;
  tanpaPaymentGateway: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminMetodePembayaran() {
  return apiFetch<MetodePembayaranAdmin[]>("/admin/metode-pembayaran", { auth: true });
}

export async function postAdminMetodePembayaran(body: {
  kode: string;
  namaLabel: string;
  adminFee: number;
  urutan: number;
  aktif: boolean;
}) {
  return apiFetch<MetodePembayaranAdmin>("/admin/metode-pembayaran", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function putAdminMetodePembayaran(
  id: number,
  body: {
    kode: string;
    namaLabel: string;
    adminFee: number;
    urutan: number;
    aktif: boolean;
  }
) {
  return apiFetch<MetodePembayaranAdmin>(`/admin/metode-pembayaran/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function deleteAdminMetodePembayaran(id: number) {
  return apiFetch<MetodePembayaranAdmin>(`/admin/metode-pembayaran/${id}`, { method: "DELETE", auth: true });
}

export async function getAdminUsers(params: { page?: number; size?: number; q?: string; role?: string; blocked?: boolean }) {
  const qs = new URLSearchParams();
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));
  if (params.q) qs.set("q", params.q);
  if (params.role) qs.set("role", params.role);
  if (params.blocked != null) qs.set("blocked", String(params.blocked));
  return apiFetch<{ content: UserAdmin[]; totalElements: number; totalPages: number; number: number; size: number }>(
    `/admin/users?${qs}`,
    { auth: true }
  );
}

export type AdminUserDetail = { user: UserAdmin; recentBookings: Booking[] };

export async function getAdminUserDetail(id: string) {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}`, { auth: true });
}

export async function patchAdminUserBlock(id: string, isBlocked: boolean) {
  return apiFetch<UserAdmin>(`/admin/users/${id}/block`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ isBlocked }),
  });
}

export async function patchAdminUserRole(id: string, role: string) {
  return apiFetch<UserAdmin>(`/admin/users/${id}/role`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ role }),
  });
}
