import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { patchBatalkanBooking, postBooking, type CreateBookingRequest } from "@/api/bookingApi";
import { queryClient } from "@/app/queryClient";

export function useCreateBookingMutation() {
  return useMutation({
    mutationFn: (req: CreateBookingRequest) => postBooking(req),
    onSuccess: (res) => {
      toast.success("Booking berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["slot"] });
      queryClient.invalidateQueries({ queryKey: ["kalender"] });
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Gagal membuat booking");
    },
  });
}

export function useBatalkanBookingMutation() {
  return useMutation({
    mutationFn: (id: number) => patchBatalkanBooking(id),
    onSuccess: () => {
      toast.success("Booking dibatalkan");
      queryClient.invalidateQueries({ queryKey: ["booking", "saya"] });
      queryClient.invalidateQueries({ queryKey: ["slot"] });
      queryClient.invalidateQueries({ queryKey: ["kalender"] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Gagal membatalkan booking");
    },
  });
}

