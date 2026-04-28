import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { useLapanganListQuery } from "@/features/lapangan/queries";
import { useSlotQuery } from "@/features/slot/queries";
import { useCreateBookingMutation } from "@/features/booking/mutations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminWaButton } from "@/components/AdminWaButton";
import { setStoredUser } from "@/api/authStorage";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

const ADMIN_FEE: Record<"QRIS" | "TRANSFER" | "EMONEY", number> = {
  QRIS: 1500,
  TRANSFER: 2500,
  EMONEY: 2000,
};

export function BookingNewPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const session = getAuthSession();
  const user = session?.user ?? null;

  const lapanganQ = useLapanganListQuery();

  const initial = useMemo(() => {
    const lapanganId = Number(sp.get("lapanganId"));
    const tanggal = sp.get("tanggal") ?? "";
    const jam = sp.get("jam") ?? "";
    return {
      lapanganId: Number.isFinite(lapanganId) && lapanganId > 0 ? lapanganId : null,
      tanggal,
      jamMulai: jam,
    };
  }, [sp]);

  const [lapanganId, setLapanganId] = useState<number | null>(initial.lapanganId);
  const [tanggal, setTanggal] = useState<string>(initial.tanggal);
  const [jamMulai, setJamMulai] = useState<string>(initial.jamMulai);
  const [durasiJam, setDurasiJam] = useState<number>(1);
  const [metodePembayaran, setMetodePembayaran] = useState<"QRIS" | "TRANSFER" | "EMONEY">("QRIS");
  const [noHp, setNoHp] = useState<string>(user?.noHp ?? "");

  useEffect(() => {
    if (user) return;
    clearAccessToken();
    const returnTo = `/booking/new?${sp.toString()}`;
    navigate(`/masuk?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (lapanganId != null) return;
    const first = lapanganQ.data?.[0]?.id;
    if (first) setLapanganId(first);
  }, [lapanganId, lapanganQ.data]);

  useEffect(() => {
    if (lapanganId) sp.set("lapanganId", String(lapanganId));
    if (tanggal) sp.set("tanggal", tanggal);
    if (jamMulai) sp.set("jam", jamMulai);
    setSp(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lapanganId, tanggal, jamMulai]);

  const slotQ = useSlotQuery({
    lapanganId: lapanganId ?? 0,
    tanggal,
  });

  const allSlots = useMemo(() => slotQ.data ?? [], [slotQ.data]);
  const availableSlots = useMemo(() => allSlots.filter((s) => s.tersedia), [allSlots]);

  useEffect(() => {
    if (!jamMulai) return;
    const current = allSlots.find((s) => s.jam === jamMulai);
    if (current && !current.tersedia) setJamMulai("");
  }, [allSlots, jamMulai]);

  const contiguousDurations = useMemo(() => {
    if (!jamMulai) return [1];
    const idx = availableSlots.findIndex((s) => s.jam === jamMulai);
    if (idx < 0) return [1];

    let max = 1;
    for (let i = idx; i + 1 < availableSlots.length; i++) {
      const cur = availableSlots[i].jam;
      const next = availableSlots[i + 1].jam;
      const curHour = Number(cur.slice(0, 2));
      const nextHour = Number(next.slice(0, 2));
      if (nextHour !== curHour + 1) break;
      max++;
    }
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [availableSlots, jamMulai]);

  useEffect(() => {
    if (!contiguousDurations.includes(durasiJam)) setDurasiJam(1);
  }, [contiguousDurations, durasiJam]);

  const estimasiTotal = useMemo(() => {
    if (!jamMulai) return null;
    const idx = availableSlots.findIndex((s) => s.jam === jamMulai);
    if (idx < 0) return null;
    return availableSlots.slice(idx, idx + durasiJam).reduce((sum, s) => sum + s.harga, 0);
  }, [availableSlots, durasiJam, jamMulai]);

  const estimasiBiayaAdmin = useMemo(() => ADMIN_FEE[metodePembayaran], [metodePembayaran]);
  const estimasiGrandTotal = useMemo(() => (estimasiTotal == null ? null : estimasiTotal + estimasiBiayaAdmin), [
    estimasiTotal,
    estimasiBiayaAdmin,
  ]);

  const createMutation = useCreateBookingMutation();

  const canSubmit =
    Boolean(lapanganId && tanggal && jamMulai && durasiJam >= 1 && noHp.trim()) && !createMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-lexend text-2xl font-semibold">Booking Baru</h1>

      <p className="text-sm text-muted-foreground mt-2">
        Pilih lapangan, tanggal, jam mulai, dan durasi. Booking akan langsung mengunci slot.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border bg-card p-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Nomor WhatsApp</div>
          <Input
            value={noHp}
            onChange={(e) => setNoHp(e.target.value)}
            placeholder="+62xxxx atau 08xxxx"
            disabled={createMutation.isPending}
          />
          <div className="text-xs text-muted-foreground">
            Wajib diisi untuk notifikasi booking. Akan disimpan untuk booking berikutnya.
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Lapangan</div>
          {lapanganQ.isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <Select
              value={lapanganId ? String(lapanganId) : undefined}
              onValueChange={(v) => setLapanganId(Number(v))}
              disabled={createMutation.isPending}
            >
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
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Tanggal</div>
          <Input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            disabled={createMutation.isPending}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Jam mulai</div>
            {slotQ.isLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : (
              <Select value={jamMulai || undefined} onValueChange={setJamMulai} disabled={createMutation.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder={tanggal ? "Pilih jam mulai" : "Pilih tanggal dulu"} />
                </SelectTrigger>
                <SelectContent>
                  {allSlots.map((s) => (
                    <SelectItem key={s.jam} value={s.jam} disabled={!s.tersedia}>
                      {s.jam} • {formatRupiah(s.harga)} {!s.tersedia ? "• booked" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {slotQ.isError && (
              <div className="text-xs text-destructive">
                {(slotQ.error as any)?.message ?? "Gagal memuat slot"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Durasi (jam)</div>
            <Select
              value={String(durasiJam)}
              onValueChange={(v) => setDurasiJam(Number(v))}
              disabled={createMutation.isPending || !jamMulai}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih durasi" />
              </SelectTrigger>
              <SelectContent>
                {contiguousDurations.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} jam
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/10 p-3 text-sm flex items-center justify-between">
          <div className="text-muted-foreground">Estimasi total</div>
          <div className="font-lexend font-semibold">{estimasiTotal == null ? "-" : formatRupiah(estimasiTotal)}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Metode pembayaran</div>
          <Select
            value={metodePembayaran}
            onValueChange={(v) => setMetodePembayaran(v as any)}
            disabled={createMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih metode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="QRIS">QRIS</SelectItem>
              <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
              <SelectItem value="EMONEY">E-Money</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-xl border bg-muted/10 p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Biaya admin</div>
              <div className="font-lexend font-semibold">{formatRupiah(estimasiBiayaAdmin)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Grand total</div>
              <div className="font-lexend font-semibold">
                {estimasiGrandTotal == null ? "-" : formatRupiah(estimasiGrandTotal)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="rounded-lg flex-1"
            disabled={!canSubmit}
            onClick={async () => {
              if (!lapanganId) return;
              if (!tanggal || !jamMulai) return;
              if (!noHp.trim()) {
                toast.error("Nomor WhatsApp wajib diisi");
                return;
              }
              try {
                const res = await createMutation.mutateAsync({
                  lapanganId,
                  tanggalMain: tanggal,
                  jamMulai,
                  durasiJam,
                  metodePembayaran,
                  noHp: noHp.trim(),
                });
                if (user) {
                  setStoredUser({ ...user, noHp: noHp.trim() });
                }
                navigate(`/booking/${res.id}`, { replace: true });
                toast.success(`Booking dibuat. Lanjutkan pembayaran untuk konfirmasi.`);
              } catch {
                // handled by mutation onError
              }
            }}
          >
            {createMutation.isPending ? "Membuat..." : "Buat Booking"}
          </Button>
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/jadwal">Batal</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Button asChild className="rounded-lg">
          <Link to="/lapangan">Kembali ke Katalog</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/jadwal">Kembali ke Jadwal</Link>
        </Button>
      </div>
      <AdminWaButton />
    </div>
  );
}

