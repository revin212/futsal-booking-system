import { useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { useLapanganListQuery } from "@/features/lapangan/queries";
import { useSlotHariIniQuery } from "@/features/slot/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminWaButton } from "@/components/AdminWaButton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

export function HomePage() {
  const lapanganQ = useLapanganListQuery();
  const slotHariIniQ = useSlotHariIniQuery();

  const hargaMulaiDari = (lapanganQ.data ?? []).reduce<number | null>((acc, x) => {
    if (acc === null) return x.hargaMulaiDari;
    return Math.min(acc, x.hargaMulaiDari);
  }, null);

  useEffect(() => {
    if (lapanganQ.isError) toast.error((lapanganQ.error as any)?.message ?? "Gagal memuat lapangan");
  }, [lapanganQ.isError, lapanganQ.error]);

  useEffect(() => {
    if (slotHariIniQ.isError) toast.error((slotHariIniQ.error as any)?.message ?? "Gagal memuat slot hari ini");
  }, [slotHariIniQ.isError, slotHariIniQ.error]);

  return (
    <div className="pb-24 md:pb-0">
      <section className="relative w-full min-h-[520px] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.10),transparent_60%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-16">
          <h1 className="font-lexend text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
            Booking Lapangan Futsal Jadi Lebih Mudah
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl">
            Cari, cek ketersediaan, dan langsung booking lapangan futsal favoritmu tanpa ribet.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild className="rounded-lg">
              <Link to="/lapangan">Booking Sekarang</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg">
              <Link to="/jadwal">Lihat Jadwal</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h2 className="font-lexend text-2xl font-semibold">Pilihan Lapangan</h2>
          <p className="text-sm text-muted-foreground">Lapangan aktif yang bisa langsung kamu cek jadwalnya.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lapanganQ.isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                  </CardFooter>
                </Card>
              ))
            : (lapanganQ.data ?? []).slice(0, 3).map((l) => (
                <Card key={l.id} className="overflow-hidden flex flex-col">
                  <img
                    src={l.fotoUtama?.filePath ?? "/static/demo/lapangan-a.jpg"}
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
                    <Button asChild className="rounded-lg flex-1" size="sm">
                      <Link to={`/lapangan/${l.id}`}>Detail</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-lg flex-1" size="sm">
                      <Link to={`/jadwal?lapanganId=${l.id}`}>Jadwal</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h2 className="font-lexend text-2xl font-semibold">Slot Tersedia Hari Ini</h2>
          <p className="text-sm text-muted-foreground">
            {slotHariIniQ.data ? `Untuk ${slotHariIniQ.data.lapanganNama}` : "Memuat ketersediaan..."}
          </p>
        </div>

        {slotHariIniQ.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {(slotHariIniQ.data?.slots ?? []).slice(0, 12).map((s) => (
              <div
                key={s.jam}
                className={`rounded-xl border p-3 text-sm ${
                  s.tersedia ? "bg-card" : "bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="font-lexend font-semibold">{s.jam}</div>
                <div className="text-xs mt-1">{formatRupiah(s.harga)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h2 className="font-lexend text-2xl font-semibold">Testimoni</h2>
          <p className="text-sm text-muted-foreground">Kata mereka yang sudah main di sini.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { nama: "Rizky", isi: "Proses bookingnya gampang, lapangannya bersih." },
            { nama: "Nadia", isi: "Admin responsif. Jadwalnya jelas dan rapi." },
            { nama: "Agus", isi: "Harga masuk akal, fasilitas lengkap." },
          ].map((t) => (
            <div key={t.nama} className="rounded-2xl border bg-card p-4">
              <div className="font-lexend font-semibold">{t.nama}</div>
              <div className="text-sm text-muted-foreground mt-2">{t.isi}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border bg-card p-6 flex items-center justify-between gap-4">
          <div>
            <div className="font-lexend text-xl font-semibold">Harga mulai dari</div>
            <div className="text-sm text-muted-foreground mt-1">
              {hargaMulaiDari == null ? "Memuat..." : formatRupiah(hargaMulaiDari)}
            </div>
          </div>
          <Button asChild className="rounded-lg">
            <Link to="/lapangan">Lihat Katalog</Link>
          </Button>
        </div>
      </section>
      <AdminWaButton />
    </div>
  );
}

