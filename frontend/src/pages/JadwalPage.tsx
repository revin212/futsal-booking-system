import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useLapanganListQuery } from "@/features/lapangan/queries";
import { useSlotQuery } from "@/features/slot/queries";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

export function JadwalPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const lapanganQ = useLapanganListQuery();

  const initialLapanganId = useMemo(() => {
    const fromQs = Number(sp.get("lapanganId"));
    if (Number.isFinite(fromQs) && fromQs > 0) return fromQs;
    return null;
  }, [sp]);

  const initialTanggal = useMemo(() => sp.get("tanggal") ?? "", [sp]);

  const [lapanganId, setLapanganId] = useState<number | null>(initialLapanganId);
  const [tanggal, setTanggal] = useState<string>(initialTanggal);

  useEffect(() => {
    if (lapanganId != null) return;
    const first = lapanganQ.data?.[0]?.id;
    if (first) setLapanganId(first);
  }, [lapanganId, lapanganQ.data]);

  useEffect(() => {
    // default tanggal: hari ini (Asia/Jakarta not needed on client; use local date)
    if (tanggal) return;
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setTanggal(`${yyyy}-${mm}-${dd}`);
  }, [tanggal]);

  useEffect(() => {
    if (lapanganId) sp.set("lapanganId", String(lapanganId));
    if (tanggal) sp.set("tanggal", tanggal);
    setSp(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lapanganId, tanggal]);

  const slotQ = useSlotQuery({
    lapanganId: lapanganId ?? 0,
    tanggal,
  });

  useEffect(() => {
    if (lapanganQ.isError) toast.error((lapanganQ.error as any)?.message ?? "Gagal memuat lapangan");
  }, [lapanganQ.isError, lapanganQ.error]);

  useEffect(() => {
    if (slotQ.isError) toast.error((slotQ.error as any)?.message ?? "Gagal memuat slot");
  }, [slotQ.isError, slotQ.error]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Jadwal</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Pilih tanggal untuk melihat jam yang tersedia dan yang sudah dibooking.
          </p>
        </div>

        <div className="w-full sm:w-[520px] grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lapanganQ.isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <Select value={lapanganId ? String(lapanganId) : undefined} onValueChange={(v) => setLapanganId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih lapangan" />
              </SelectTrigger>
              <SelectContent>
                {(lapanganQ.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-lexend font-semibold">Jam & Ketersediaan</div>
          <div className="text-xs text-muted-foreground">
            Klik jam yang <span className="font-semibold">available</span> untuk lanjut booking.
          </div>
        </div>

        <div className="mt-4">
          {slotQ.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : (slotQ.data?.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">Tidak ada slot untuk tanggal ini.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(slotQ.data ?? []).map((s) => {
                const disabled = !s.tersedia || !lapanganId;
                return (
                  <button
                    key={s.jam}
                    disabled={disabled}
                    onClick={() => {
                      if (!lapanganId) return;
                      if (!s.tersedia) return;
                      navigate(`/booking/new?lapanganId=${lapanganId}&tanggal=${tanggal}&jam=${s.jam}`);
                    }}
                    className={`text-left rounded-xl border p-3 transition-colors ${
                      s.tersedia
                        ? "bg-card hover:bg-muted/30"
                        : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-lexend font-semibold">{s.jam}</div>
                      <div className={`text-xs font-semibold ${s.tersedia ? "text-primary" : ""}`}>
                        {s.tersedia ? "available" : "booked"}
                      </div>
                    </div>
                    <div className="text-sm mt-1">{formatRupiah(s.harga)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

