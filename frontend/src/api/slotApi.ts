import { apiFetch } from "@/api/http";

export type Slot = {
  jam: string; // "07:00"
  tersedia: boolean;
  harga: number;
};

export type SlotHariIni = {
  lapanganId: number;
  lapanganNama: string;
  tanggal: string; // YYYY-MM-DD
  slots: Slot[];
};

export async function getSlotHariIni(lapanganId?: number) {
  const qs = lapanganId ? `?lapanganId=${encodeURIComponent(String(lapanganId))}` : "";
  return apiFetch<SlotHariIni>(`/slot-hari-ini${qs}`);
}

export async function getSlot(params: { lapanganId: number; tanggal: string }) {
  const qs = new URLSearchParams({
    lapanganId: String(params.lapanganId),
    tanggal: params.tanggal,
  });
  return apiFetch<Slot[]>(`/slot?${qs.toString()}`);
}

