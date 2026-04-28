import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { patchAdminRefundAction } from "@/api/adminApi";
import { queryClient } from "@/app/queryClient";

export function useAdminRefundActionMutation() {
  return useMutation({
    mutationFn: (p: { bookingId: number; action: "APPROVE" | "REJECT"; note?: string }) =>
      patchAdminRefundAction(p.bookingId, { action: p.action, note: p.note }),
    onSuccess: async (res) => {
      toast.success(`Refund booking #${res.id} diproses (${res.refundStatus ?? "-"})`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "refund"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
      await queryClient.invalidateQueries({ queryKey: ["booking", "detail", res.id] });
      await queryClient.invalidateQueries({ queryKey: ["booking", "saya"] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Gagal memproses refund"),
  });
}

