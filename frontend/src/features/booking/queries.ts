import { useQuery } from "@tanstack/react-query";
import { getBookingSaya } from "@/api/bookingApi";

export function useBookingSayaQuery() {
  return useQuery({
    queryKey: ["booking", "saya"],
    queryFn: getBookingSaya,
  });
}

