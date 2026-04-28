import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  patchAdminVerifikasiBooking,
  patchBatalkanBooking,
  patchKonfirmasiBayar,
  postBayarMockBooking,
  postBooking,
  postUploadBuktiBooking,
  type AdminVerifyAction,
  type CreateBookingRequest,
} from "@/api/bookingApi";
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

export function useUploadBuktiBookingMutation() {
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => postUploadBuktiBooking(id, file),
    onSuccess: (res) => {
      toast.success("Bukti bayar berhasil diupload");
      queryClient.invalidateQueries({ queryKey: ["booking", "detail", res.id] });
      queryClient.invalidateQueries({ queryKey: ["booking", "saya"] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Gagal upload bukti bayar");
    },
  });
}

export function useKonfirmasiBayarMutation() {
  return useMutation({
    mutationFn: (id: number) => patchKonfirmasiBayar(id),
    onSuccess: (res) => {
      toast.success("Pembayaran dikonfirmasi. Menunggu verifikasi admin.");
      queryClient.invalidateQueries({ queryKey: ["booking", "detail", res.id] });
      queryClient.invalidateQueries({ queryKey: ["booking", "saya"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "booking", "menunggu_verifikasi"] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Gagal konfirmasi bayar");
    },
  });
}

export function useMockPayBookingMutation() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => postBayarMockBooking(id),
    onSuccess: (res) => {
      toast.success("Pembayaran berhasil (mock). Menunggu verifikasi admin.");
      queryClient.invalidateQueries({ queryKey: ["booking", "detail", res.id] });
      queryClient.invalidateQueries({ queryKey: ["booking", "saya"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "booking", "menunggu_verifikasi"] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Gagal memproses pembayaran");
    },
  });
}

export function useAdminVerifikasiBookingMutation() {
  return useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: AdminVerifyAction; note?: string }) =>
      patchAdminVerifikasiBooking(id, { action, note }),
    onSuccess: (res) => {
      toast.success(`Booking #${res.id} diverifikasi (${res.status})`);
      queryClient.invalidateQueries({ queryKey: ["admin", "booking", "menunggu_verifikasi"] });
      queryClient.invalidateQueries({ queryKey: ["booking", "detail", res.id] });
      queryClient.invalidateQueries({ queryKey: ["booking", "saya"] });
      queryClient.invalidateQueries({ queryKey: ["slot"] });
      queryClient.invalidateQueries({ queryKey: ["kalender"] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Gagal verifikasi booking");
    },
  });
}

