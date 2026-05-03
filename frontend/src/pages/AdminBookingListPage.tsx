import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useAdminBookingRangeQuery, useAdminLapanganListQuery } from "@/features/admin/queries";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const STATUSES = [
  "",
  "DIBUAT",
  "MENUNGGU_PEMBAYARAN",
  "MENUNGGU_VERIFIKASI",
  "LUNAS",
  "DITOLAK",
  "DIBAYAR",
  "SELESAI",
  "DIBATALKAN",
];

export function AdminBookingListPage() {
  const [rangeMode, setRangeMode] = useState<"TODAY" | "WEEK">("TODAY");
  const [status, setStatus] = useState("");
  const [lapanganId, setLapanganId] = useState<string>("");
  const [q, setQ] = useState("");

  const { start, end } = useMemo(() => {
    const now = new Date();
    const s = new Date(now);
    const e = new Date(now);
    if (rangeMode === "WEEK") e.setDate(e.getDate() + 6);
    return { start: yyyyMmDd(s), end: yyyyMmDd(e) };
  }, [rangeMode]);

  const lapanganQ = useAdminLapanganListQuery(true);
  const bookingQ = useAdminBookingRangeQuery({
    start,
    end,
    status: status || undefined,
    lapanganId: lapanganId ? Number(lapanganId) : undefined,
    q: q.trim() || undefined,
    enabled: true,
  });

  useEffect(() => {
    if (bookingQ.isError) toast.error((bookingQ.error as any)?.message ?? "Gagal memuat booking admin");
  }, [bookingQ.isError, bookingQ.error]);

  const bookings = bookingQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-lexend text-2xl font-semibold">List Booking</h1>
        <p className="text-sm text-muted-foreground mt-2">Filter dan kelola booking pada rentang tanggal.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Status</div>
            <Select value={status || "__ALL__"} onValueChange={(v) => setStatus(v === "__ALL__" ? "" : v)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Semua status</SelectItem>
                {STATUSES.filter(Boolean).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Lapangan</div>
            <Select value={lapanganId || "__ALL__"} onValueChange={(v) => setLapanganId(v === "__ALL__" ? "" : v)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Semua lapangan</SelectItem>
                {(lapanganQ.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">Cari (no HP / user ID / invoice)</div>
            <Input className="rounded-lg" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Opsional" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-lexend text-lg font-semibold">Rentang</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{start}</span> s/d <span className="font-medium">{end}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={rangeMode === "TODAY" ? "default" : "outline"} className="rounded-lg" onClick={() => setRangeMode("TODAY")}>
            Hari ini
          </Button>
          <Button variant={rangeMode === "WEEK" ? "default" : "outline"} className="rounded-lg" onClick={() => setRangeMode("WEEK")}>
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
          <CardContent className="text-sm text-muted-foreground">Belum ada booking pada filter ini.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  #{b.id} <Badge variant="outline">{b.status}</Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {b.lapanganNama} • {b.tanggalMain} • {hhmm(b.jamMulai)}-{hhmm(b.jamSelesai)}
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground truncate">User: {b.userId}</div>
                <Button asChild size="sm" variant="outline" className="rounded-lg shrink-0">
                  <Link to={`/admin/booking/${b.id}`}>Detail</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
