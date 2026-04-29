import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { useBookingDetailQuery } from "@/features/booking/queries";
import { useCreatePaymentIntentMutation } from "@/features/payment/mutations";
import { useRefundBookingMutation } from "@/features/booking/mutations";
import { refundLabel, refundTimestampText, refundVariant } from "@/features/booking/refundUi";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

function bookingStartAtJakarta(tanggalMain?: string, jamMulai?: string) {
  if (!tanggalMain || !jamMulai) return null;
  const hm = jamMulai?.length >= 5 ? jamMulai.slice(0, 5) : jamMulai;
  const iso = `${tanggalMain}T${hm}:00+07:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function BookingDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = session?.user ?? null;

  const bookingId = useMemo(() => Number(params.id), [params.id]);
  const q = useBookingDetailQuery(bookingId);

  const createIntentMut = useCreatePaymentIntentMutation();
  const refundMut = useRefundBookingMutation();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");

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
  const canPay =
    (b?.status === "MENUNGGU_PEMBAYARAN" || b?.status === "DIBUAT") && !createIntentMut.isPending;
  const canRefund =
    b?.status === "LUNAS" &&
    (b?.refundStatus == null || b.refundStatus === "NONE" || b.refundStatus === "REJECTED") &&
    (() => {
      const startAt = bookingStartAtJakarta(b?.tanggalMain, b?.jamMulai);
      // If parsing fails, let backend validate.
      if (!startAt) return true;
      const diffMinutes = (startAt.getTime() - Date.now()) / 60000;
      return diffMinutes >= 0 && diffMinutes <= 60;
    })();

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
                <span className="text-muted-foreground">Refund</span>
                <div className="flex items-center gap-2">
                  <Badge variant={refundVariant(b.refundStatus)} className="rounded-full">
                    {refundLabel(b.refundStatus)}
                  </Badge>
                </div>
              </div>
              {refundTimestampText(b) ? (
                <div className="text-xs text-muted-foreground">{refundTimestampText(b)}</div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-lexend font-semibold">{formatRupiah(b.totalHarga)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Metode</span>
                <span className="font-semibold">{b.metodePembayaran ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">No. WhatsApp</span>
                <span className="font-mono text-xs">
                  {b.noHp && b.noHp.trim().length > 0 ? b.noHp : "-"}
                </span>
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
              {b.invoiceNumber ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-mono text-xs">{b.invoiceNumber}</span>
                </div>
              ) : null}
            </CardContent>
            {(b.status === "LUNAS" || b.status === "SELESAI") ? (
              <CardFooter>
                <Button asChild variant="outline" className="rounded-lg">
                  <Link to={`/invoice/${b.id}`}>Lihat Invoice</Link>
                </Button>
                {b.status === "LUNAS" ? (
                  <Button
                    variant="destructive"
                    className="rounded-lg ml-auto"
                    disabled={!canRefund || refundMut.isPending}
                    onClick={async () => {
                      setRefundReason("");
                      setRefundOpen(true);
                    }}
                  >
                    {refundMut.isPending ? "Memproses..." : "Ajukan Refund"}
                  </Button>
                ) : null}
              </CardFooter>
            ) : null}
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
              ) : b.status === "MENUNGGU_VERIFIKASI" ? (
                <div className="text-sm text-muted-foreground">
                  Pembayaran sudah dicatat, menunggu verifikasi admin.{" "}
                  {b.metodePembayaran === "CASH" ? (
                    <span className="font-semibold">Metode: cash</span>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Pembayaran tercatat dengan metode <span className="font-semibold">{b.metodePembayaran ?? "-"}</span>.
                  {b.verifiedAt ? <div className="mt-1">Terverifikasi pada {b.verifiedAt}.</div> : null}
                </div>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              {canPay ? (
                <Button
                  className="rounded-lg"
                  disabled={!canPay}
                  onClick={async () => {
                    if (!b) return;
                    try {
                      const intent = await createIntentMut.mutateAsync(b.id);
                      navigate(`/payment-gateway/${intent.id}`);
                    } catch {
                      // handled by mutation
                    }
                  }}
                >
                  {createIntentMut.isPending ? "Memproses..." : "Bayar via Gateway (Mock)"}
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        </>
      )}

      <AlertDialog open={refundOpen} onOpenChange={(open) => (!open ? setRefundOpen(false) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan refund?</AlertDialogTitle>
            <AlertDialogDescription>
              Isi alasan refund (minimal 10 karakter). Estimasi refund:{" "}
              <span className="font-lexend font-semibold">{formatRupiah(b?.paidAmount ?? 0)}</span>
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
              disabled={refundMut.isPending}
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
              Refund akan diproses admin (mock). Estimasi refund:{" "}
              <span className="font-lexend font-semibold">{formatRupiah(b?.paidAmount ?? 0)}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={refundMut.isPending}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg"
              disabled={refundMut.isPending || !b}
              onClick={async (e) => {
                e.preventDefault();
                if (!b) return;
                try {
                  await refundMut.mutateAsync({ id: b.id, reason: refundReason.trim() });
                  setRefundConfirmOpen(false);
                  setRefundOpen(false);
                } catch {
                  // handled by mutation
                }
              }}
            >
              {refundMut.isPending ? "Memproses..." : "Ya, ajukan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

