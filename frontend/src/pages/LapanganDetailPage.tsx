import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useLapanganDetailQuery } from "@/features/lapangan/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function parseFasilitas(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

const hariLabels = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export function LapanganDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const q = useLapanganDetailQuery(id);

  const fasilitas = useMemo(() => (q.data ? parseFasilitas(q.data.fasilitas) : []), [q.data]);
  const fotoUtama = useMemo(() => {
    const fotos = q.data?.fotos ?? [];
    return fotos.find((f) => f.isUtama) ?? fotos[0] ?? null;
  }, [q.data]);

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat detail lapangan");
  }, [q.isError, q.error]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-lexend text-2xl font-semibold">
            {q.isLoading ? <Skeleton className="h-8 w-48" /> : q.data?.nama}
          </h1>
          <div className="text-sm text-muted-foreground">
            {q.isLoading ? <Skeleton className="h-4 w-64" /> : q.data?.tipe}
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/lapangan">Kembali</Link>
        </Button>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          {q.isLoading ? (
            <Skeleton className="aspect-video w-full rounded-2xl" />
          ) : (
            <div className="rounded-2xl border overflow-hidden bg-card">
              <img
                src={fotoUtama?.filePath ?? "/static/demo/lapangan-a.jpg"}
                alt={q.data?.nama ?? "Lapangan"}
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {(q.isLoading ? Array.from({ length: 3 }) : (q.data?.fotos ?? []).slice(0, 3)).map((f: any, i) =>
              q.isLoading ? (
                <Skeleton key={i} className="aspect-video w-full rounded-xl" />
              ) : (
                <div key={f.id} className="rounded-xl border overflow-hidden bg-card">
                  <img
                    src={f.filePath}
                    alt={`${q.data?.nama ?? "Lapangan"} foto`}
                    className="w-full aspect-video object-cover"
                  />
                </div>
              )
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="font-lexend font-semibold">Harga</div>
            {q.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-44" />
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Regular</span>
                  <span className="font-semibold">{formatRupiah(q.data!.hargaRegular)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Peak hour</span>
                  <span className="font-semibold">{formatRupiah(q.data!.hargaPeakHour)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Weekend</span>
                  <span className="font-semibold">{formatRupiah(q.data!.hargaWeekend)}</span>
                </div>
              </div>
            )}
            <div className="pt-2 flex gap-2">
              <Button asChild className="rounded-lg flex-1">
                <Link to="/jadwal">Lihat Jadwal</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-lg flex-1">
                <Link to={`/booking/new?lapanganId=${id}`}>Booking</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="font-lexend font-semibold">Fasilitas</div>
            {q.isLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            ) : fasilitas.length ? (
              <div className="flex flex-wrap gap-2">
                {fasilitas.map((x) => (
                  <Badge key={x} variant="secondary">
                    {x}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">-</div>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-lexend font-semibold">Jam Operasional</div>
              <div className="text-xs text-muted-foreground">Rating: (placeholder)</div>
            </div>
            {q.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <div className="text-sm divide-y">
                {(q.data?.jamOperasional ?? []).map((j) => (
                  <div key={j.hariKe} className="py-2 flex items-center justify-between">
                    <div className="text-muted-foreground">{hariLabels[j.hariKe] ?? `Hari ${j.hariKe}`}</div>
                    <div className="font-semibold">
                      {j.jamBuka} - {j.jamTutup}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

