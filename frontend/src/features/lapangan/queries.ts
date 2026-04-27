import { useQuery } from "@tanstack/react-query";
import { getLapanganDetail, getLapanganList } from "@/api/lapanganApi";

export function useLapanganListQuery() {
  return useQuery({
    queryKey: ["lapangan", "list"],
    queryFn: getLapanganList,
  });
}

export function useLapanganDetailQuery(id: number) {
  return useQuery({
    queryKey: ["lapangan", "detail", id],
    queryFn: () => getLapanganDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

