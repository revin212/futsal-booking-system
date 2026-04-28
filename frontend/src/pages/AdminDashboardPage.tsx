import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { useAdminBookingRangeQuery, useAdminMetricsQuery, useAdminNotificationLogQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function yyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hhmm(v: string) {
  return v?.length >= 5 ? v.slice(0, 5) : v;
}

export function AdminDashboardPage() {
  const session = getAuthSession();
  const user = session?.user ?? null;
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (user) return;
    clearAccessToken();
    navigate(`/admin/login?returnTo=${encodeURIComponent("/admin/dashboard")}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [rangeMode, setRangeMode] = useState<"TODAY" | "WEEK">("TODAY");
  const { start, end } = useMemo(() => {
    const now = new Date();
    const s = new Date(now);
    const e = new Date(now);
    if (rangeMode === "WEEK") e.setDate(e.getDate() + 6);
    return { start: yyyyMmDd(s), end: yyyyMmDd(e) };
  }, [rangeMode]);

  const metricsQ = useAdminMetricsQuery(Boolean(isAdmin));
  const bookingQ = useAdminBookingRangeQuery({ start, end, enabled: Boolean(isAdmin) });
  const notifQ = useAdminNotificationLogQuery({ limit: 10, enabled: Boolean(isAdmin) });

  useEffect(() => {
    if (metricsQ.isError) toast.error((metricsQ.error as any)?.message ?? "Gagal memuat metrics admin");
  }, [metricsQ.isError, metricsQ.error]);

  useEffect(() => {
    if (bookingQ.isError) toast.error((bookingQ.error as any)?.message ?? "Gagal memuat booking admin");
  }, [bookingQ.isError, bookingQ.error]);

  useEffect(() => {
    if (notifQ.isError) toast.error((notifQ.error as any)?.message ?? "Gagal memuat log notifikasi");
  }, [notifQ.isError, notifQ.error]);

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Akses ditolak</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Halaman ini hanya untuk admin.</CardContent>
        </Card>
      </div>
    );
  }

  const metrics = metricsQ.data;
  const bookings = bookingQ.data ?? [];
  const notif = notifQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Admin • Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">Monitoring operasional booking & notifikasi (mock).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/admin/booking">Verifikasi</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/">Beranda</Link>
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
            <div className="text-xs text-muted-foreground mt-1">Status MENUNGGU_PEMBAYARAN (belum expired)</div>
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

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-lexend text-lg font-semibold">Booking</h2>
          <p className="text-sm text-muted-foreground">
            Rentang: <span className="font-medium">{start}</span> s/d <span className="font-medium">{end}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={rangeMode === "TODAY" ? "default" : "outline"}
            className="rounded-lg"
            onClick={() => setRangeMode("TODAY")}
          >
            Hari ini
          </Button>
          <Button
            variant={rangeMode === "WEEK" ? "default" : "outline"}
            className="rounded-lg"
            onClick={() => setRangeMode("WEEK")}
          >
            7 hari
          </Button>
        </div>
      </div>

      {bookingQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tidak ada booking</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Belum ada booking pada rentang tanggal ini.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  #{b.id} • <span className="font-semibold">{b.status}</span>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {b.lapanganNama} • {b.tanggalMain} • {hhmm(b.jamMulai)}-{hhmm(b.jamSelesai)}
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">User: {b.userId}</div>
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link to={`/booking/${b.id}`}>Lihat Detail</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-4">
        <h2 className="font-lexend text-lg font-semibold">Log notifikasi (terbaru)</h2>
        <p className="text-sm text-muted-foreground mt-1">Sumber: tabel notification_log (WA mock).</p>
      </div>

      {notifQ.isLoading ? (
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
        </Card>
      ) : notif.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada notifikasi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Buat booking atau bayar mock untuk memunculkan log.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notif.map((n) => (
            <Card key={n.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {n.notificationType} • {n.recipientType}
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  #{n.id} • booking {n.bookingId ?? "-"} • {n.createdAt}
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                <div className="text-muted-foreground">{n.templateKey ?? "-"}</div>
                <div className="mt-1">{n.message}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

