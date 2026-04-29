import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { useBookingSayaQuery } from "@/features/booking/queries";
import { useBatalkanBookingMutation, useRefundBookingMutation } from "@/features/booking/mutations";
import { refundLabel, refundTimestampText, refundVariant } from "@/features/booking/refundUi";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminWaButton } from "@/components/AdminWaButton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function formatTanggal(t: string) {
  // expecting YYYY-MM-DD
  return t;
}

function hhmm(v: string) {
  // backend can return HH:mm:ss
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

function bookingStartAtJakarta(tanggalMain?: string, jamMulai?: string) {
  if (!tanggalMain || !jamMulai) return null;
  const hm = jamMulai?.length >= 5 ? jamMulai.slice(0, 5) : jamMulai;
  const iso = `${tanggalMain}T${hm}:00+07:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function BookingSayaPage() {
  const session = getAuthSession();
  const user = session?.user ?? null;
  const q = useBookingSayaQuery(Boolean(session));
  const batalMutation = useBatalkanBookingMutation();
  const refundMut = useRefundBookingMutation();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [refundId, setRefundId] = useState<number | null>(null);
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    if (user) return;
    // If user/token missing, treat as logged out
    clearAccessToken();
    toast.error("Sesi login habis. Silakan login ulang.");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat booking");
  }, [q.isError, q.error]);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const confirmBooking = useMemo(() => items.find((x) => x.id === confirmId) ?? null, [confirmId, items]);
  const refundBooking = useMemo(() => items.find((x) => x.id === refundId) ?? null, [refundId, items]);

  const canRefund = (b: (typeof items)[number]) => {
    if (b.status !== "LUNAS") return false;
    if (!(b.refundStatus == null || b.refundStatus === "NONE" || b.refundStatus === "REJECTED")) return false;

    const startAt = bookingStartAtJakarta(b.tanggalMain, b.jamMulai);
    // If parsing fails, let backend decide.
    if (!startAt) return true;
    const diffMinutes = (startAt.getTime() - Date.now()) / 60000;
    return diffMinutes >= 0 && diffMinutes <= 60;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Booking Saya</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Daftar booking yang kamu buat. Booking yang dibatalkan tidak akan mengunci slot.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Batas waktu pembayaran untuk booking status <span className="font-semibold">MENUNGGU_PEMBAYARAN</span> adalah{" "}
            <span className="font-semibold">10 menit</span> sejak booking dibuat.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Batas pembatalan booking adalah <span className="font-semibold">maksimal 1 jam</span> sebelum jadwal main.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/jadwal">Ke Jadwal</Link>
        </Button>
      </div>

      {!user ? (
        <Card>
          <CardHeader>
            <CardTitle>Butuh login</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Halaman ini membutuhkan login.
          </CardContent>
          <CardFooter>
            <Button asChild className="rounded-lg">
              <Link to="/masuk">Masuk</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
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
            <CardTitle>Belum ada booking</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Kamu belum pernah membuat booking. Mulai dari jadwal atau katalog.
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild className="rounded-lg">
              <Link to="/jadwal">Buat Booking</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg">
              <Link to="/lapangan">Lihat Katalog</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle>Booking #{b.id}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {formatTanggal(b.tanggalMain)} • {hhmm(b.jamMulai)} - {hhmm(b.jamSelesai)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Dibuat: <span className="font-medium">{formatCreatedAt(b.createdAt)}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold">{b.status}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">Refund</span>
                  <Badge variant={refundVariant(b.refundStatus)} className="rounded-full">
                    {refundLabel(b.refundStatus)}
                  </Badge>
                </div>
                {refundTimestampText(b) ? (
                  <div className="mt-1 text-xs text-muted-foreground">{refundTimestampText(b)}</div>
                ) : null}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-lexend font-semibold">{formatRupiah(b.totalHarga)}</span>
                </div>
                {b.status === "MENUNGGU_PEMBAYARAN" ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Batas waktu pembayaran <span className="font-semibold">10 menit</span> sejak booking dibuat. Jika
                    lewat, booking akan otomatis dibatalkan dan slot kembali tersedia.
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Pembatalan mengikuti aturan sistem (MinJamBatalkan). Jika sudah terlalu dekat dengan jam main,
                    pembatalan ditolak (maksimal 1 jam sebelum jadwal).
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <Button asChild variant="outline" className="rounded-lg" size="sm">
                  <Link to={`/booking/${b.id}`}>Detail / Pembayaran</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-lg" size="sm">
                  <Link to={`/jadwal?lapanganId=${b.lapanganId}`}>Lihat di Jadwal</Link>
                </Button>
                {canRefund(b) ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-lg"
                    disabled={refundMut.isPending}
                    onClick={() => {
                      setRefundReason("");
                      setRefundId(b.id);
                    }}
                  >
                    {refundMut.isPending ? "Memproses..." : "Ajukan Refund"}
                  </Button>
                ) : null}
                {b.status !== "LUNAS" && b.status !== "SELESAI" ? (
                  <Button
                    className="rounded-lg"
                    size="sm"
                    variant="destructive"
                    disabled={b.status === "DIBATALKAN" || batalMutation.isPending}
                    onClick={() => setConfirmId(b.id)}
                  >
                    {b.status === "DIBATALKAN" ? "Dibatalkan" : "Batalkan"}
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={confirmId != null} onOpenChange={(open) => (!open ? setConfirmId(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmBooking ? (
                <>
                  Booking #{confirmBooking.id} pada {formatTanggal(confirmBooking.tanggalMain)}{" "}
                  {hhmm(confirmBooking.jamMulai)}-{hhmm(confirmBooking.jamSelesai)} akan dibatalkan.
                </>
              ) : (
                "Booking akan dibatalkan."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={batalMutation.isPending}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg"
              disabled={batalMutation.isPending || confirmId == null}
              onClick={() => {
                if (confirmId == null) return;
                batalMutation.mutate(confirmId);
                setConfirmId(null);
              }}
            >
              {batalMutation.isPending ? "Memproses..." : "Ya, batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={refundId != null} onOpenChange={(open) => (!open ? setRefundId(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan refund?</AlertDialogTitle>
            <AlertDialogDescription>
              {refundBooking ? (
                <>
                  Booking #{refundBooking.id} akan tetap aktif saat refund menunggu keputusan admin (mock). Estimasi refund:{" "}
                  <span className="font-lexend font-semibold">{formatRupiah(refundBooking.paidAmount ?? 0)}</span>
                </>
              ) : (
                "Isi alasan refund (minimal 10 karakter)."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <div className="text-sm font-medium">Reason</div>
            <textarea
              className="w-full min-h-24 rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="Contoh: Jadwal bentrok, mohon refund."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Panjang: <span className="font-medium">{refundReason.trim().length}</span>/10
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={refundMut.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg"
              disabled={refundMut.isPending || refundId == null}
              onClick={(e) => {
                e.preventDefault();
                if (refundReason.trim().length < 10) {
                  toast.error("Reason minimal 10 karakter");
                  return;
                }
                setRefundConfirmOpen(true);
              }}
            >
              Lanjut
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={refundConfirmOpen} onOpenChange={(open) => (!open ? setRefundConfirmOpen(false) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi pengajuan refund</AlertDialogTitle>
            <AlertDialogDescription>
              {refundBooking ? (
                <>
                  Estimasi refund: <span className="font-lexend font-semibold">{formatRupiah(refundBooking.paidAmount ?? 0)}</span>
                </>
              ) : (
                "Refund akan diajukan."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={refundMut.isPending}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg"
              disabled={refundMut.isPending || refundBooking == null}
              onClick={async (e) => {
                e.preventDefault();
                if (!refundBooking) return;
                try {
                  await refundMut.mutateAsync({ id: refundBooking.id, reason: refundReason.trim() });
                  setRefundConfirmOpen(false);
                  setRefundId(null);
                } catch {
                  // handled
                }
              }}
            >
              {refundMut.isPending ? "Memproses..." : "Ya, ajukan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AdminWaButton />
    </div>
  );
}

