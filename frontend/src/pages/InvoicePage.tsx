import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { useInvoiceQuery } from "@/features/invoice/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function hhmm(v: string) {
  return v?.length >= 5 ? v.slice(0, 5) : v;
}

export function InvoicePage() {
  const params = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = session?.user ?? null;

  const bookingId = useMemo(() => Number(params.bookingId), [params.bookingId]);
  const q = useInvoiceQuery(bookingId);

  useEffect(() => {
    if (user) return;
    clearAccessToken();
    navigate(`/masuk?returnTo=${encodeURIComponent(`/invoice/${params.bookingId ?? ""}`)}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat invoice");
  }, [q.isError, q.error]);

  const inv = q.data;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Invoice</h1>
          <p className="text-sm text-muted-foreground mt-2">Invoice tersedia untuk booking status LUNAS/SELESAI.</p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to={`/booking/${bookingId}`}>Kembali</Link>
        </Button>
      </div>

      {q.isLoading ? (
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-60" />
          </CardContent>
        </Card>
      ) : !inv ? (
        <Card>
          <CardHeader>
            <CardTitle>Invoice tidak ditemukan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Periksa kembali booking ID.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{inv.invoiceNumber}</span>
              <Button variant="outline" className="rounded-lg" onClick={() => window.print()}>
                Print
              </Button>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Booking #{inv.bookingId} • {inv.lapanganNama} • {inv.tanggalMain} • {hhmm(inv.jamMulai)}-{hhmm(inv.jamSelesai)}
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold">{inv.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Issued at</span>
              <span className="font-mono text-xs">{inv.invoiceIssuedAt}</span>
            </div>
            {inv.paidAt ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paid at</span>
                <span className="font-mono text-xs">{inv.paidAt}</span>
              </div>
            ) : null}

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-lexend font-semibold">{formatRupiah(inv.totalHarga)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Admin fee</span>
                <span className="font-lexend font-semibold">{formatRupiah(inv.adminFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Grand total</span>
                <span className="font-lexend font-semibold">{formatRupiah(inv.grandTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

