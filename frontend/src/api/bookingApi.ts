import { apiFetch } from "@/api/http";

export type CreateBookingRequest = {
  lapanganId: number;
  tanggalMain: string; // YYYY-MM-DD
  jamMulai: string; // HH:mm
  durasiJam: number;
};

export type Booking = {
  id: number;
  userId: string;
  lapanganId: number;
  tanggalMain: string;
  jamMulai: string;
  jamSelesai: string;
  status: string;
  totalHarga: number;
  createdAt: string;
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

export async function patchBatalkanBooking(id: number) {
  return apiFetch<Booking>(`/booking/${id}/batalkan`, {
    method: "PATCH",
    auth: true,
  });
}

