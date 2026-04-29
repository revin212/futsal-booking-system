import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { useAdminMenungguVerifikasiQuery } from "@/features/booking/queries";
import { useAdminVerifikasiBookingMutation } from "@/features/booking/mutations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function hhmm(v: string) {
  return v?.length >= 5 ? v.slice(0, 5) : v;
}

export function AdminBookingPage() {
  const session = getAuthSession();
  const user = session?.user ?? null;
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (user) return;
    clearAccessToken();
    navigate(`/admin/login?returnTo=${encodeURIComponent("/admin/booking")}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const q = useAdminMenungguVerifikasiQuery(Boolean(isAdmin));
  const verifyMut = useAdminVerifikasiBookingMutation();

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat data admin");
  }, [q.isError, q.error]);

  const items = useMemo(() => q.data ?? [], [q.data]);

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Akses ditolak</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Halaman ini hanya untuk admin.
          </CardContent>
          <CardFooter>
            <Button asChild className="rounded-lg">
              <Link to="/">Kembali ke Beranda</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Admin • Verifikasi Booking</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Daftar booking dengan status <span className="font-semibold">MENUNGGU_VERIFIKASI</span>.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/">Beranda</Link>
        </Button>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-44" />
              </CardContent>
              <CardFooter className="gap-2">
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tidak ada antrian</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Belum ada booking yang menunggu verifikasi.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle>Booking #{b.id}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {b.lapanganNama} • {b.tanggalMain} • {hhmm(b.jamMulai)}-{hhmm(b.jamSelesai)}
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-lexend font-semibold">{formatRupiah(b.totalHarga)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bukti</span>
                  <span className="font-mono text-xs">{b.buktiBayarPath ?? "-"}</span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  className="rounded-lg"
                  disabled={verifyMut.isPending}
                  onClick={() => verifyMut.mutate({ id: b.id, action: "APPROVE" })}
                >
                  Approve
                </Button>
                <Button
                  className="rounded-lg"
                  variant="destructive"
                  disabled={verifyMut.isPending}
                  onClick={() => verifyMut.mutate({ id: b.id, action: "REJECT" })}
                >
                  Reject
                </Button>
                <Button asChild variant="outline" className="rounded-lg ml-auto" size="sm">
                  <Link to={`/admin/booking/${b.id}`}>Lihat Detail</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

