import { apiFetch } from "@/api/http";

export type CreateBookingRequest = {
  lapanganId: number;
  tanggalMain: string; // YYYY-MM-DD
  jamMulai: string; // HH:mm
  durasiJam: number;
  metodePembayaran: string;
  noHp?: string;
};

export type Booking = {
  id: number;
  userId: string;
  lapanganId: number;
  lapanganNama: string;
  tanggalMain: string;
  jamMulai: string;
  jamSelesai: string;
  status: string;
  totalHarga: number;
  metodePembayaran: string | null;
  noHp: string | null;
  adminFee: number | null;
  grandTotal: number | null;
  dpNominal: number | null;
  paidAmount: number | null;
  buktiBayarPath: string | null;
  verifiedAt: string | null;
  invoiceNumber: string | null;
  invoiceIssuedAt: string | null;
  createdAt: string;
  refundStatus?: string | null;
  refundAmount?: number | null;
  refundReason?: string | null;
  refundRequestedAt?: string | null;
  refundProcessedAt?: string | null;
};

export async function postBooking(req: CreateBookingRequest) {
  return apiFetch<Booking>("/booking", {
    method: "POST",
    auth: true,
    body: JSON.stringify(req),
  });
}

export async function getBookingSaya() {
  return apiFetch<Booking[]>("/booking-saya", {
    auth: true,
  });
}

export async function getBookingDetail(id: number) {
  return apiFetch<Booking>(`/booking/${id}`, {
    auth: true,
  });
}

export async function getAdminBookingDetail(id: number) {
  return apiFetch<Booking>(`/admin/booking/${id}`, {
    auth: true,
  });
}

export async function patchBatalkanBooking(id: number) {
  return apiFetch<Booking>(`/booking/${id}/batalkan`, {
    method: "PATCH",
    auth: true,
  });
}

export async function postUploadBuktiBooking(id: number, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch<Booking>(`/booking/${id}/upload-bukti`, {
    method: "POST",
    auth: true,
    body: fd,
  });
}

export async function patchKonfirmasiBayar(id: number) {
  return apiFetch<Booking>(`/booking/${id}/konfirmasi-bayar`, {
    method: "PATCH",
    auth: true,
  });
}

export type MockPayMethod = "QRIS" | "TRANSFER" | "EMONEY";

export async function postMockPayBooking(id: number, method: MockPayMethod) {
  return apiFetch<Booking>(`/booking/${id}/mock-pay`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ method }),
  });
}

export async function postBayarMockBooking(id: number) {
  return apiFetch<Booking>(`/booking/${id}/bayar-mock`, {
    method: "POST",
    auth: true,
  });
}

export async function getAdminBookingMenungguVerifikasi() {
  return apiFetch<Booking[]>("/admin/booking", {
    auth: true,
  });
}

export type AdminVerifyAction = "APPROVE" | "REJECT";

export async function patchAdminVerifikasiBooking(id: number, body: { action: AdminVerifyAction; note?: string }) {
  return apiFetch<Booking>(`/admin/booking/${id}/verifikasi`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

