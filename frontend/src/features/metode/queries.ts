import { useQuery } from "@tanstack/react-query";

import { getMetodePembayaranAktif } from "@/api/metodePembayaranApi";

export function useMetodePembayaranAktifQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["metode-pembayaran", "aktif"],
    queryFn: getMetodePembayaranAktif,
    enabled,
    staleTime: 60_000,
  });
}
