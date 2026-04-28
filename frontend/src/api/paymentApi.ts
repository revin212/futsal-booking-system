import { apiFetch } from "@/api/http";

export type PaymentIntent = {
  id: string;
  bookingId: number;
  provider: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED";
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export async function postCreatePaymentIntent(bookingId: number) {
  return apiFetch<PaymentIntent>("/payment-intent", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ bookingId }),
    headers: { "Idempotency-Key": `booking-${bookingId}` },
  });
}

export async function getPaymentIntent(id: string) {
  return apiFetch<PaymentIntent>(`/payment-intent/${id}`, { auth: true });
}

export async function postMockGatewayPay(intentId: string) {
  return apiFetch<void>(`/mock-gateway/${intentId}/pay`, { method: "POST", auth: true });
}

export async function postMockGatewayFail(intentId: string) {
  return apiFetch<void>(`/mock-gateway/${intentId}/fail`, { method: "POST", auth: true });
}

