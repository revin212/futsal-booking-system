import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { useBookingDetailQuery } from "@/features/booking/queries";
import { useMockPayBookingMutation } from "@/features/booking/mutations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function hhmm(v: string) {
  return v?.length >= 5 ? v.slice(0, 5) : v;
}

function formatCreatedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function BookingDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = session?.user ?? null;

  const bookingId = useMemo(() => Number(params.id), [params.id]);
  const q = useBookingDetailQuery(bookingId);

  const mockPayMut = useMockPayBookingMutation();

  useEffect(() => {
    if (user) return;
    clearAccessToken();
    const returnTo = `/booking/${params.id ?? ""}`;
    navigate(`/masuk?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat booking");
  }, [q.isError, q.error]);

  const b = q.data;
  const canMockPay =
    (b?.status === "MENUNGGU_PEMBAYARAN" || b?.status === "DIBUAT") && !mockPayMut.isPending;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Detail Booking</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Batas waktu pembayaran untuk booking status <span className="font-semibold">MENUNGGU_PEMBAYARAN</span> adalah{" "}
            <span className="font-semibold">10 menit</span> sejak booking dibuat.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/booking-saya">Kembali</Link>
        </Button>
      </div>

      {q.isLoading ? (
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
          <CardFooter className="gap-2">
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </CardFooter>
        </Card>
      ) : !b ? (
        <Card>
          <CardHeader>
            <CardTitle>Booking tidak ditemukan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Booking ini tidak tersedia atau akses ditolak.</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Booking #{b.id}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {b.lapanganNama} • {b.tanggalMain} • {hhmm(b.jamMulai)}-{hhmm(b.jamSelesai)}
              </div>
              <div className="text-xs text-muted-foreground">
                Dibuat: <span className="font-medium">{formatCreatedAt(b.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold">{b.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-lexend font-semibold">{formatRupiah(b.totalHarga)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Metode</span>
                <span className="font-semibold">{b.metodePembayaran ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Biaya admin</span>
                <span className="font-lexend font-semibold">{formatRupiah(b.adminFee ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Grand total</span>
                <span className="font-lexend font-semibold">{formatRupiah(b.grandTotal ?? b.totalHarga)}</span>
              </div>
              {b.verifiedAt ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tanggal Pembayaran</span>
                  <span className="font-mono text-xs">{b.verifiedAt}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {b.status === "MENUNGGU_PEMBAYARAN" ? (
                <div className="text-sm text-muted-foreground">
                  Batas waktu pembayaran <span className="font-semibold">10 menit</span> sejak booking dibuat. Jika lewat,
                  booking akan otomatis dibatalkan dan slot kembali tersedia.
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Ini simulasi seperti payment gateway (mis. Xendit). Klik “Bayar (Mock)” untuk menandai pembayaran berhasil.
                </div>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                className="rounded-lg"
                disabled={!canMockPay}
                onClick={async () => {
                  if (!b) return;
                  try {
                    await mockPayMut.mutateAsync({ id: b.id });
                  } catch {
                    // handled by mutation
                  }
                }}
              >
                {mockPayMut.isPending ? "Memproses..." : "Bayar (Mock)"}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

