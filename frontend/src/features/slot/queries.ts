import { useQuery } from "@tanstack/react-query";
import { getSlot, getSlotHariIni } from "@/api/slotApi";

export function useSlotHariIniQuery(lapanganId?: number) {
  return useQuery({
    queryKey: ["slot", "hari-ini", lapanganId ?? null],
    queryFn: () => getSlotHariIni(lapanganId),
  });
}

export function useSlotQuery(params: { lapanganId: number; tanggal: string }) {
  return useQuery({
    queryKey: ["slot", params.lapanganId, params.tanggal],
    queryFn: () => getSlot(params),
    enabled: Boolean(params.lapanganId && params.tanggal),
  });
}

