import { useQuery } from "@tanstack/react-query";
import {
  getAdminAuditLog,
  getAdminBookingRange,
  type AdminBookingRangeParams,
  getAdminFinanceInvoices,
  getAdminFinanceReport,
  getAdminFinanceSummary,
  getAdminKalender,
  getAdminLapanganFotos,
  getAdminLapanganJam,
  getAdminLapanganList,
  getAdminMetrics,
  getAdminNotificationLog,
  getAdminPaymentIntents,
  getAdminRefundList,
  getAdminSettings,
  getAdminUserDetail,
  getAdminUsers,
} from "@/api/adminApi";

export function useAdminMetricsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: getAdminMetrics,
    enabled,
    refetchInterval: 30_000,
  });
}

export function useAdminBookingRangeQuery(params: AdminBookingRangeParams & { enabled: boolean }) {
  const { enabled, ...rest } = params;
  return useQuery({
    queryKey: ["admin", "booking", "range", rest],
    queryFn: () => getAdminBookingRange(rest),
    enabled,
  });
}

export function useAdminNotificationLogQuery(params: {
  limit?: number;
  enabled: boolean;
  notificationType?: string;
  recipientType?: string;
  from?: string;
  to?: string;
}) {
  const { enabled, ...rest } = params;
  return useQuery({
    queryKey: ["admin", "notification-log", rest],
    queryFn: () => getAdminNotificationLog(rest),
    enabled,
  });
}

export function useAdminAuditLogQuery(params: {
  limit?: number;
  enabled: boolean;
  action?: string;
  entityType?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
}) {
  const { enabled, ...rest } = params;
  return useQuery({
    queryKey: ["admin", "audit-log", rest],
    queryFn: () => getAdminAuditLog(rest),
    enabled,
  });
}

export function useAdminKalenderQuery(lapanganId: number | null, start: string, end: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "kalender", lapanganId, start, end],
    queryFn: () => getAdminKalender(lapanganId!, start, end),
    enabled: enabled && lapanganId != null && lapanganId > 0,
  });
}

export function useAdminFinanceSummaryQuery(start: string, end: string, groupBy: "DATE" | "METODE" | "LAPANGAN", enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "finance", "summary", start, end, groupBy],
    queryFn: () => getAdminFinanceSummary(start, end, groupBy),
    enabled,
  });
}

export function useAdminFinanceInvoicesQuery(start: string, end: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "finance", "invoice", start, end],
    queryFn: () => getAdminFinanceInvoices(start, end),
    enabled,
  });
}

export function useAdminFinanceReportQuery(start: string, end: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "finance", "report", start, end],
    queryFn: () => getAdminFinanceReport(start, end),
    enabled,
  });
}

export function useAdminRefundListQuery(status: "PENDING" | "REFUNDED" | "REJECTED", enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "refund", status],
    queryFn: () => getAdminRefundList(status),
    enabled,
  });
}

export function useAdminLapanganListQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "lapangan", "list"],
    queryFn: getAdminLapanganList,
    enabled,
  });
}

export function useAdminLapanganFotosQuery(lapanganId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "lapangan", lapanganId, "foto"],
    queryFn: () => getAdminLapanganFotos(lapanganId),
    enabled: enabled && lapanganId > 0,
  });
}

export function useAdminLapanganJamQuery(lapanganId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "lapangan", lapanganId, "jam"],
    queryFn: () => getAdminLapanganJam(lapanganId),
    enabled: enabled && lapanganId > 0,
  });
}

export function useAdminPaymentIntentsQuery(params: { start?: string; end?: string; status?: string }, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "payment-intent", params],
    queryFn: () => getAdminPaymentIntents(params),
    enabled,
  });
}

export function useAdminUsersQuery(params: { page: number; size: number; q?: string; role?: string; blocked?: boolean }, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsers(params),
    enabled,
  });
}

export function useAdminUserDetailQuery(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => getAdminUserDetail(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminSettingsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminSettings,
    enabled,
  });
}
