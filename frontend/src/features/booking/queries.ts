import { useQuery } from "@tanstack/react-query";
import { getAdminBookingDetail, getAdminBookingMenungguVerifikasi, getBookingDetail, getBookingSaya } from "@/api/bookingApi";

export function useBookingSayaQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["booking", "saya"],
    queryFn: getBookingSaya,
    enabled,
  });
}

export function useBookingDetailQuery(id: number) {
  return useQuery({
    queryKey: ["booking", "detail", id],
    queryFn: () => getBookingDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useAdminMenungguVerifikasiQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "booking", "menunggu_verifikasi"],
    queryFn: getAdminBookingMenungguVerifikasi,
    enabled,
  });
}

export function useAdminBookingDetailQuery(id: number) {
  return useQuery({
    queryKey: ["admin", "booking", "detail", id],
    queryFn: () => getAdminBookingDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

