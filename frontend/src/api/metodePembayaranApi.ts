import { apiFetch } from "@/api/http";

export type MetodePembayaranPublic = {
  kode: string;
  namaLabel: string;
  adminFee: number;
  tanpaPaymentGateway: boolean;
};

export async function getMetodePembayaranAktif() {
  return apiFetch<MetodePembayaranPublic[]>("/metode-pembayaran");
}
