import type { Booking } from "@/api/bookingApi";

export function refundLabel(status?: string | null) {
  const s = (status ?? "NONE").toUpperCase();
  switch (s) {
    case "PENDING":
      return "REFUND PENDING";
    case "REFUNDED":
      return "REFUND SELESAI";
    case "REJECTED":
      return "REFUND DITOLAK";
    default:
      return "TIDAK ADA REFUND";
  }
}

export function refundVariant(status?: string | null): "default" | "secondary" | "outline" {
  const s = (status ?? "NONE").toUpperCase();
  if (s === "PENDING") return "default";
  if (s === "REFUNDED") return "secondary";
  if (s === "REJECTED") return "outline";
  return "outline";
}

export function refundTimestampText(b: Booking) {
  const s = (b.refundStatus ?? "NONE").toUpperCase();
  if (s === "PENDING" && b.refundRequestedAt) return `Diajukan: ${b.refundRequestedAt}`;
  if ((s === "REFUNDED" || s === "REJECTED") && b.refundProcessedAt) return `Diproses: ${b.refundProcessedAt}`;
  return null;
}

