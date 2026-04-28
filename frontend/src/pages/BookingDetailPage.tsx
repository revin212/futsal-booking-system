import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { getStoredUser } from "@/api/authStorage";
import { env } from "@/env";
import { useBookingDetailQuery } from "@/features/booking/queries";
import { useKonfirmasiBayarMutation, useUploadBuktiBookingMutation } from "@/features/booking/mutations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function hhmm(v: string) {
  return v?.length >= 5 ? v.slice(0, 5) : v;
}

function buktiUrl(path: string | null) {
  if (!path) return null;
  const base = env.apiBaseUrl ?? "/api";
  return `${base}/../backend/storage/${path}`;
}

export function BookingDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();

  const bookingId = useMemo(() => Number(params.id), [params.id]);
  const q = useBookingDetailQuery(bookingId);

  const uploadMut = useUploadBuktiBookingMutation();
  const konfirmasiMut = useKonfirmasiBayarMutation();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) return;
    const returnTo = `/booking/${params.id ?? ""}`;
    navigate(`/masuk?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat booking");
  }, [q.isError, q.error]);

  const b = q.data;
  const canUpload = Boolean(file) && !uploadMut.isPending && user != null;
  const canKonfirmasi =
    (b?.status === "MENUNGGU_PEMBAYARAN" || b?.status === "DIBUAT") &&
    Boolean(b?.buktiBayarPath) &&
    !konfirmasiMut.isPending;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Detail Booking</h1>
          <p className="text-sm text-muted-foreground mt-2">Upload bukti bayar dan konfirmasi untuk diverifikasi admin.</p>
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
                <span className="text-muted-foreground">Bukti bayar</span>
                <span className="font-mono text-xs">{b.buktiBayarPath ?? "-"}</span>
              </div>
              {b.verifiedAt ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verified at</span>
                  <span className="font-mono text-xs">{b.verifiedAt}</span>
                </div>
              ) : null}
              {buktiUrl(b.buktiBayarPath) ? (
                <div className="text-xs text-muted-foreground">
                  Catatan: URL preview bukti belum diekspos; path disimpan untuk kebutuhan internal.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-semibold">Upload bukti bayar</div>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  disabled={uploadMut.isPending}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div className="text-xs text-muted-foreground">
                  Format gambar/PDF. Setelah upload, tekan “Konfirmasi bayar”.
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                className="rounded-lg"
                disabled={!canUpload}
                onClick={async () => {
                  if (!b) return;
                  if (!file) return;
                  try {
                    await uploadMut.mutateAsync({ id: b.id, file });
                    setFile(null);
                  } catch {
                    // handled by mutation
                  }
                }}
              >
                {uploadMut.isPending ? "Mengunggah..." : "Kirim Bukti"}
              </Button>
              <Button
                className="rounded-lg"
                variant="outline"
                disabled={!canKonfirmasi}
                onClick={async () => {
                  if (!b) return;
                  try {
                    await konfirmasiMut.mutateAsync(b.id);
                  } catch {
                    // handled by mutation
                  }
                }}
              >
                {konfirmasiMut.isPending ? "Memproses..." : "Konfirmasi bayar"}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

