import { useQuery } from "@tanstack/react-query";
import { getInvoice } from "@/api/invoiceApi";

export function useInvoiceQuery(bookingId: number) {
  return useQuery({
    queryKey: ["invoice", bookingId],
    queryFn: () => getInvoice(bookingId),
    enabled: Number.isFinite(bookingId) && bookingId > 0,
  });
}

