import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useAdminBookingRangeQuery, useAdminMetricsQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function yyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatRupiahShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(Math.round(n));
}

export function AdminDashboardPage() {
  const { start, end } = useMemo(() => {
    const endD = new Date();
    const startD = new Date();
    startD.setDate(startD.getDate() - 6);
    return { start: yyyyMmDd(startD), end: yyyyMmDd(endD) };
  }, []);

  const metricsQ = useAdminMetricsQuery(true);
  const bookingQ = useAdminBookingRangeQuery({ start, end, enabled: true });

  useEffect(() => {
    if (metricsQ.isError) toast.error((metricsQ.error as any)?.message ?? "Gagal memuat metrics admin");
  }, [metricsQ.isError, metricsQ.error]);

  useEffect(() => {
    if (bookingQ.isError) toast.error((bookingQ.error as any)?.message ?? "Gagal memuat data booking");
  }, [bookingQ.isError, bookingQ.error]);

  const metrics = metricsQ.data;
  const bookings = bookingQ.data ?? [];

  const chartData = useMemo(() => {
    const dayKeys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayKeys.push(yyyyMmDd(d));
    }
    const byDay = new Map<string, number>();
    for (const k of dayKeys) byDay.set(k, 0);
    for (const b of bookings) {
      if (b.status !== "LUNAS" && b.status !== "SELESAI") continue;
      const amt = b.paidAmount ?? b.grandTotal ?? b.totalHarga ?? 0;
      const cur = byDay.get(b.tanggalMain) ?? 0;
      byDay.set(b.tanggalMain, cur + Number(amt));
    }
    return dayKeys.map((k) => ({
      label: k.slice(5),
      tanggal: k,
      revenue: byDay.get(k) ?? 0,
    }));
  }, [bookings]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">Ringkasan operasional hari ini.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-lg" size="sm">
            <Link to="/admin/booking">List booking</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-lg" size="sm">
            <Link to="/admin/booking/queue">Antrian verifikasi</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsQ.isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="font-lexend text-2xl font-semibold">{metrics?.pendingAktif ?? 0}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">MENUNGGU_PEMBAYARAN (belum expired)</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">LUNAS hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsQ.isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="font-lexend text-2xl font-semibold">{metrics?.lunasHariIni ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">SELESAI hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsQ.isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="font-lexend text-2xl font-semibold">{metrics?.selesaiHariIni ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendapatan (LUNAS + SELESAI)</CardTitle>
          <CardDescription>7 hari terakhir — agregasi dari paidAmount / grandTotal per tanggal main.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {bookingQ.isLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatRupiahShort(Number(v))} width={48} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value ?? 0);
                    return [
                      new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n),
                      "Pendapatan",
                    ];
                  }}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.tanggal as string) ?? ""}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Pendapatan" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-lg" size="sm">
          <Link to="/admin/sistem/notifikasi">Log notifikasi</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-lg" size="sm">
          <Link to="/admin/sistem/audit-log">Audit log</Link>
        </Button>
      </div>
    </div>
  );
}
