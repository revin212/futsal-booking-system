import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useLapanganListQuery } from "@/features/lapangan/queries";
import { useLapanganDetailQuery } from "@/features/lapangan/queries";
import { useSlotQuery } from "@/features/slot/queries";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoredUser } from "@/api/authStorage";
import { AdminWaButton } from "@/components/AdminWaButton";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

export function JadwalPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const user = getStoredUser();

  const lapanganQ = useLapanganListQuery();

  const initialLapanganId = useMemo(() => {
    const fromQs = Number(sp.get("lapanganId"));
    if (Number.isFinite(fromQs) && fromQs > 0) return fromQs;
    return null;
  }, [sp]);

  const initialTanggal = useMemo(() => sp.get("tanggal") ?? "", [sp]);

  const [lapanganId, setLapanganId] = useState<number | null>(initialLapanganId);
  const [tanggal, setTanggal] = useState<string>(initialTanggal);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(sp.get("only") === "available");
  const tanggalInputRef = useRef<HTMLInputElement>(null);

  function openTanggalPicker() {
    const el = tanggalInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {
      // showPicker can throw in strict privacy modes
    }
    el.focus();
    el.click();
  }

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
    if (onlyAvailable) sp.set("only", "available");
    else sp.delete("only");
    setSp(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lapanganId, tanggal, onlyAvailable]);

  const lapanganDetailQ = useLapanganDetailQuery(lapanganId ?? 0);

  const slotQ = useSlotQuery({
    lapanganId: lapanganId ?? 0,
    tanggal,
  });

  const visibleSlots = useMemo(() => {
    const all = slotQ.data ?? [];
    return onlyAvailable ? all.filter((s) => s.tersedia) : all;
  }, [onlyAvailable, slotQ.data]);

  const priceTag = useMemo(() => {
    const d = lapanganDetailQ.data;
    if (!d) return null;
    return {
      regular: Number(d.hargaRegular),
      peak: Number(d.hargaPeakHour),
      weekend: Number(d.hargaWeekend),
    };
  }, [lapanganDetailQ.data]);

  function getHargaLabel(harga: number) {
    if (!priceTag) return null;
    if (harga === priceTag.peak) return { text: "peak", variant: "default" as const };
    if (harga === priceTag.weekend) return { text: "weekend", variant: "outline" as const };
    return { text: "regular", variant: "secondary" as const };
  }

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

          <Input
            ref={tanggalInputRef}
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            onClick={openTanggalPicker}
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-lexend font-semibold">Jam & Ketersediaan</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOnlyAvailable((v) => !v)}
              className={`text-xs font-semibold rounded-full border px-3 py-1 transition-colors ${
                onlyAvailable ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted/30"
              }`}
            >
              {onlyAvailable ? "Hanya available" : "Tampilkan semua"}
            </button>
            <div className="text-xs text-muted-foreground">
              Klik jam <span className="font-semibold">available</span> untuk booking.
            </div>
          </div>
        </div>

        <div className="mt-4">
          {slotQ.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : (visibleSlots.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">Tidak ada slot untuk tanggal ini.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleSlots.map((s) => {
                const disabled = !s.tersedia || !lapanganId;
                const label = getHargaLabel(s.harga);
                return (
                  <button
                    key={s.jam}
                    disabled={disabled}
                    onClick={() => {
                      if (!lapanganId) return;
                      if (!s.tersedia) return;
                      const returnTo = `/booking/new?lapanganId=${lapanganId}&tanggal=${tanggal}&jam=${s.jam}`;
                      if (!user) {
                        navigate(`/masuk?returnTo=${encodeURIComponent(returnTo)}`);
                        return;
                      }
                      navigate(returnTo);
                    }}
                    className={`text-left rounded-xl border p-3 transition-colors ${
                      s.tersedia
                        ? "bg-card hover:bg-muted/30"
                        : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-lexend font-semibold">{s.jam}</div>
                      <div className="flex items-center gap-2">
                        {label && <Badge variant={label.variant}>{label.text}</Badge>}
                        <div className={`text-xs font-semibold ${s.tersedia ? "text-primary" : ""}`}>
                          {s.tersedia ? "available" : "booked"}
                        </div>
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
      <AdminWaButton />
    </div>
  );
}

