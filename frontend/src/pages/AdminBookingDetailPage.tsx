import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchAdminVerifikasiBooking } from "@/api/bookingApi";
import { toast } from "sonner";

import { patchAdminCancelBooking, patchAdminRescheduleBooking } from "@/api/adminApi";
import { useAdminBookingDetailQuery } from "@/features/booking/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function hhmm(v: string) {
  return v?.length >= 5 ? v.slice(0, 5) : v;
}

const RESCHEDULE_STATUSES = new Set(["LUNAS", "MENUNGGU_VERIFIKASI", "MENUNGGU_PEMBAYARAN"]);

export function AdminBookingDetailPage() {
  const params = useParams();
  const bookingId = useMemo(() => Number(params.id), [params.id]);
  const qc = useQueryClient();

  const q = useAdminBookingDetailQuery(bookingId);

  const [resOpen, setResOpen] = useState(false);
  const [tanggalMain, setTanggalMain] = useState("");
  const [jamMulai, setJamMulai] = useState("18:00");
  const [durasiJam, setDurasiJam] = useState("2");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [alasan, setAlasan] = useState("");

  const rescheduleMut = useMutation({
    mutationFn: () =>
      patchAdminRescheduleBooking(bookingId, {
        tanggalMain,
        jamMulai: jamMulai.length === 5 ? jamMulai + ":00" : jamMulai,
        durasiJam: Number(durasiJam),
      }),
    onSuccess: () => {
      toast.success("Jadwal diubah");
      setResOpen(false);
      qc.invalidateQueries({ queryKey: ["admin", "booking"] });
      qc.invalidateQueries({ queryKey: ["admin", "booking", "detail", bookingId] });
      q.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal reschedule"),
  });

  const cancelMut = useMutation({
    mutationFn: () => patchAdminCancelBooking(bookingId, alasan),
    onSuccess: () => {
      toast.success("Booking dibatalkan");
      setCancelOpen(false);
      qc.invalidateQueries({ queryKey: ["admin", "booking"] });
      q.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal batalkan"),
  });

  useEffect(() => {
    if (q.isError) toast.error((q.error as any)?.message ?? "Gagal memuat detail booking admin");
  }, [q.isError, q.error]);

  useEffect(() => {
    const b = q.data;
    if (!b) return;
    setTanggalMain(b.tanggalMain);
    setJamMulai(hhmm(b.jamMulai));
    const start = new Date(`1970-01-01T${hhmm(b.jamMulai)}:00`);
    const end = new Date(`1970-01-01T${hhmm(b.jamSelesai)}:00`);
    const h = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
    setDurasiJam(String(h));
  }, [q.data]);

  const b = q.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Detail Booking</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Verifikasi jika status <span className="font-semibold">MENUNGGU_VERIFIKASI</span>.
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

          <CardFooter className="flex flex-wrap gap-2">
            {b.status === "MENUNGGU_VERIFIKASI" ? (
              <>
                <Button
                  className="rounded-lg"
                  onClick={async () => {
                    try {
                      await patchAdminVerifikasiBooking(b.id, { action: "APPROVE" });
                      toast.success("Disetujui");
                      qc.invalidateQueries({ queryKey: ["admin", "booking"] });
                      q.refetch();
                    } catch (e: any) {
                      toast.error(e?.message ?? "Gagal");
                    }
                  }}
                >
                  Approve
                </Button>
                <Button
                  className="rounded-lg"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await patchAdminVerifikasiBooking(b.id, { action: "REJECT" });
                      toast.success("Ditolak");
                      qc.invalidateQueries({ queryKey: ["admin", "booking"] });
                      q.refetch();
                    } catch (e: any) {
                      toast.error(e?.message ?? "Gagal");
                    }
                  }}
                >
                  Reject
                </Button>
              </>
            ) : null}

            {RESCHEDULE_STATUSES.has(b.status) ? (
              <Dialog open={resOpen} onOpenChange={setResOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-lg">
                    Reschedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reschedule booking</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1">
                      <Label>Tanggal main</Label>
                      <Input type="date" value={tanggalMain} onChange={(e) => setTanggalMain(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Jam mulai</Label>
                      <Input type="time" value={jamMulai.length > 5 ? jamMulai.slice(0, 5) : jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Durasi (jam)</Label>
                      <Select value={durasiJam} onValueChange={setDurasiJam}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["1", "2", "3", "4", "5", "6"].map((x) => (
                            <SelectItem key={x} value={x}>
                              {x} jam
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResOpen(false)}>
                      Batal
                    </Button>
                    <Button disabled={rescheduleMut.isPending || !tanggalMain} onClick={() => rescheduleMut.mutate()}>
                      {rescheduleMut.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}

            {b.status !== "DIBATALKAN" && b.status !== "SELESAI" ? (
              <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="rounded-lg">
                    Batalkan booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Batalkan booking?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label>Alasan</Label>
                    <Input value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Alasan pembatalan" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCancelOpen(false)}>
                      Tutup
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={cancelMut.isPending || !alasan.trim()}
                      onClick={() => cancelMut.mutate()}
                    >
                      {cancelMut.isPending ? "Memproses..." : "Batalkan"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
