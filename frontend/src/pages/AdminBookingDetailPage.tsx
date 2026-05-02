import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { useAdminBookingDetailQuery } from "@/features/booking/queries";
import { useAdminVerifikasiBookingMutation } from "@/features/booking/mutations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
function hhmm(v: string) {
  return v?.length >= 5 ? v.slice(0, 5) : v;
}

export function AdminBookingDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = session?.user ?? null;
  const bookingId = useMemo(() => Number(params.id), [params.id]);

  const q = useAdminBookingDetailQuery(bookingId);
  const verifyMut = useAdminVerifikasiBookingMutation();

  useEffect(() => {
    if (user) return;
    clearAccessToken();
    navigate(`/admin/login?returnTo=${encodeURIComponent(`/admin/booking/${params.id ?? ""}`)}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat detail booking admin");
  }, [q.isError, q.error]);

  const b = q.data;

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Admin • Detail Booking</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Detail booking dan verifikasi jika status masih <span className="font-semibold">MENUNGGU_VERIFIKASI</span>.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/admin/booking">Kembali</Link>
        </Button>
      </div>

      {q.isLoading ? (
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ) : !b ? (
        <Card>
          <CardHeader>
            <CardTitle>Booking tidak ditemukan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Periksa kembali ID booking.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Booking #{b.id}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {b.lapanganNama} • {b.tanggalMain} • {hhmm(b.jamMulai)}-{hhmm(b.jamSelesai)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold">{b.status}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Metode</span>
              <span className="font-semibold">{b.metodePembayaran ?? "-"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">No. WhatsApp</span>
              <span className="font-mono text-xs">{b.noHp && b.noHp.trim().length ? b.noHp : "-"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Paid amount</span>
              <span className="font-lexend font-semibold">{b.paidAmount ?? 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono text-xs">{b.invoiceNumber ?? "-"}</span>
            </div>
          </CardContent>

          {b.status === "MENUNGGU_VERIFIKASI" ? (
            <CardFooter className="gap-2">
              <Button
                className="rounded-lg"
                disabled={verifyMut.isPending}
                onClick={() => verifyMut.mutate({ id: b.id, action: "APPROVE" })}
              >
                {verifyMut.isPending ? "Memproses..." : "Approve"}
              </Button>
              <Button
                className="rounded-lg"
                variant="destructive"
                disabled={verifyMut.isPending}
                onClick={() => verifyMut.mutate({ id: b.id, action: "REJECT" })}
              >
                {verifyMut.isPending ? "Memproses..." : "Reject"}
              </Button>
            </CardFooter>
          ) : null}
        </Card>
      )}
    </div>
  );
}

