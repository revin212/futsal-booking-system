import { useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useLapanganListQuery } from "@/features/lapangan/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminWaButton } from "@/components/AdminWaButton";
import { LAPANGAN_COVER_FALLBACK } from "@/lib/lapanganCover";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

export function LapanganListPage() {
  const q = useLapanganListQuery();

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat lapangan");
  }, [q.isError, q.error]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Daftar Lapangan</h1>
          <p className="text-sm text-muted-foreground">
            Pilih lapangan favoritmu dan cek ketersediaannya.
          </p>
        </div>
        <Button variant="outline" className="rounded-lg">
          Filter (coming soon)
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {q.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                </CardContent>
                <CardFooter className="gap-2">
                  <Skeleton className="h-9 w-28 rounded-lg" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </CardFooter>
              </Card>
            ))
          : (q.data ?? []).map((l) => (
              <Card key={l.id} className="overflow-hidden flex flex-col">
                <img
                  src={l.fotoUtama?.filePath ?? LAPANGAN_COVER_FALLBACK}
                  alt={l.nama}
                  className="w-full aspect-video object-cover"
                />
                <CardHeader className="pb-2">
                  <CardTitle>{l.nama}</CardTitle>
                  <div className="text-sm text-muted-foreground">{l.tipe}</div>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <div className="text-muted-foreground">Mulai dari</div>
                  <div className="font-lexend font-semibold">{formatRupiah(l.hargaMulaiDari)}</div>
                </CardContent>
                <CardFooter className="gap-2 mt-auto">
                  <Button asChild className="rounded-lg" size="sm">
                    <Link to={`/lapangan/${l.id}`}>Detail</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-lg" size="sm">
                    <Link to={`/jadwal?lapanganId=${l.id}`}>Cek Jadwal</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
      </div>
      <AdminWaButton />
    </div>
  );
}

