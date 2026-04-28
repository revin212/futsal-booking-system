import { useQuery } from "@tanstack/react-query";
import { getPaymentIntent } from "@/api/paymentApi";

export function usePaymentIntentQuery(intentId: string) {
  return useQuery({
    queryKey: ["payment-intent", intentId],
    queryFn: () => getPaymentIntent(intentId),
    enabled: Boolean(intentId),
    refetchInterval: 5_000,
  });
}

