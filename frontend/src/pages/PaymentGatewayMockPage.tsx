import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { usePaymentIntentQuery } from "@/features/payment/queries";
import { useMockGatewayFailMutation, useMockGatewayPayMutation } from "@/features/payment/mutations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

export function PaymentGatewayMockPage() {
  const params = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = session?.user ?? null;

  const intentId = useMemo(() => String(params.intentId ?? ""), [params.intentId]);
  const q = usePaymentIntentQuery(intentId);
  const payMut = useMockGatewayPayMutation();
  const failMut = useMockGatewayFailMutation();

  useEffect(() => {
    if (user) return;
    clearAccessToken();
    navigate(`/masuk?returnTo=${encodeURIComponent(`/payment-gateway/${intentId}`)}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat payment intent");
  }, [q.isError, q.error]);

  const p = q.data;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Mock Payment Gateway</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ini simulasi gateway. Klik <span className="font-medium">Pay Success</span> untuk melunasi booking.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/">Beranda</Link>
        </Button>
      </div>

      {q.isLoading ? (
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
          <CardFooter className="gap-2">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </CardFooter>
        </Card>
      ) : !p ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment intent tidak ditemukan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Periksa kembali link pembayaran.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Intent {p.id}</CardTitle>
            <div className="text-sm text-muted-foreground">Booking #{p.bookingId}</div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold">{p.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-lexend font-semibold">{formatRupiah(p.amount)}</span>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              className="rounded-lg"
              disabled={payMut.isPending || p.status !== "PENDING"}
              onClick={async () => {
                try {
                  await payMut.mutateAsync(p.id);
                  navigate(`/booking/${p.bookingId}`, { replace: true });
                } catch {
                  // handled
                }
              }}
            >
              {payMut.isPending ? "Memproses..." : "Pay Success"}
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              disabled={failMut.isPending || p.status !== "PENDING"}
              onClick={async () => {
                try {
                  await failMut.mutateAsync(p.id);
                  toast.message("Kamu bisa mencoba bayar ulang dari halaman booking.");
                  navigate(`/booking/${p.bookingId}`);
                } catch {
                  // handled
                }
              }}
            >
              Fail / Cancel
            </Button>
            <Button asChild variant="ghost" className="rounded-lg ml-auto">
              <Link to={`/booking/${p.bookingId}`}>Kembali ke booking</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

