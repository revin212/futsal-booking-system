import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { postCreatePaymentIntent, postMockGatewayFail, postMockGatewayPay } from "@/api/paymentApi";
import { queryClient } from "@/app/queryClient";

export function useCreatePaymentIntentMutation() {
  return useMutation({
    mutationFn: (bookingId: number) => postCreatePaymentIntent(bookingId),
    onError: (err: any) => toast.error(err?.message ?? "Gagal membuat payment intent"),
  });
}

export function useMockGatewayPayMutation() {
  return useMutation({
    mutationFn: (intentId: string) => postMockGatewayPay(intentId),
    onSuccess: async () => {
      toast.success("Pembayaran berhasil (mock gateway)");
      await queryClient.invalidateQueries({ queryKey: ["booking"] });
      await queryClient.invalidateQueries({ queryKey: ["slot"] });
      await queryClient.invalidateQueries({ queryKey: ["kalender"] });
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["payment-intent"] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Gagal memproses pembayaran"),
  });
}

export function useMockGatewayFailMutation() {
  return useMutation({
    mutationFn: (intentId: string) => postMockGatewayFail(intentId),
    onSuccess: async () => {
      toast.success("Pembayaran dibatalkan (mock gateway)");
      await queryClient.invalidateQueries({ queryKey: ["payment-intent"] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Gagal membatalkan pembayaran"),
  });
}

