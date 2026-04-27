import { apiFetch } from "@/api/http";

export type FotoLapangan = {
  id: number;
  filePath: string;
  isUtama: boolean;
};

export type JamOperasional = {
  hariKe: number;
  jamBuka: string;
  jamTutup: string;
  isAktif: boolean;
};

export type LapanganListItem = {
  id: number;
  nama: string;
  tipe: string;
  deskripsi: string | null;
  fasilitas: string; // JSON string
  hargaMulaiDari: number;
  hargaRegular: number;
  hargaPeakHour: number;
  hargaWeekend: number;
  isAktif: boolean;
  createdAt: string;
  fotoUtama: FotoLapangan | null;
};

export type LapanganDetail = {
  id: number;
  nama: string;
  tipe: string;
  deskripsi: string | null;
  fasilitas: string; // JSON string
  hargaRegular: number;
  hargaPeakHour: number;
  hargaWeekend: number;
  isAktif: boolean;
  createdAt: string;
  fotos: FotoLapangan[];
  jamOperasional: JamOperasional[];
};

export async function getLapanganList() {
  return apiFetch<LapanganListItem[]>("/lapangan");
}

export async function getLapanganDetail(id: number) {
  return apiFetch<LapanganDetail>(`/lapangan/${id}`);
}

