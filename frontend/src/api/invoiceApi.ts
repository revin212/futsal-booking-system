import { apiFetch } from "@/api/http";

export type Invoice = {
  invoiceNumber: string;
  invoiceIssuedAt: string;
  bookingId: number;
  lapanganNama: string;
  tanggalMain: string;
  jamMulai: string;
  jamSelesai: string;
  totalHarga: number;
  adminFee: number;
  grandTotal: number;
  status: string;
  paidAt: string | null;
};

export async function getInvoice(bookingId: number) {
  return apiFetch<Invoice>(`/invoice/${bookingId}`, { auth: true });
}

