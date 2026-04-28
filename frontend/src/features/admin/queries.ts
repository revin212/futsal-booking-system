import { useQuery } from "@tanstack/react-query";
import { getAdminBookingRange, getAdminMetrics, getAdminNotificationLog, getAdminRefund } from "@/api/adminApi";

export function useAdminMetricsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: getAdminMetrics,
    enabled,
    refetchInterval: 30_000,
  });
}

export function useAdminBookingRangeQuery(params: { start: string; end: string; enabled: boolean }) {
  const { start, end, enabled } = params;
  return useQuery({
    queryKey: ["admin", "booking", "range", start, end],
    queryFn: () => getAdminBookingRange(start, end),
    enabled,
  });
}

export function useAdminNotificationLogQuery(params: { limit?: number; enabled: boolean }) {
  const { limit = 20, enabled } = params;
  return useQuery({
    queryKey: ["admin", "notification-log", limit],
    queryFn: () => getAdminNotificationLog(limit),
    enabled,
  });
}

export function useAdminRefundQuery(params: { status?: string; enabled: boolean }) {
  const { status = "PENDING", enabled } = params;
  return useQuery({
    queryKey: ["admin", "refund", status],
    queryFn: () => getAdminRefund(status),
    enabled,
  });
}

