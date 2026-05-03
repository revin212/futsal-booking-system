import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteAdminMetodePembayaran,
  type MetodePembayaranAdmin,
  postAdminMetodePembayaran,
  putAdminMetodePembayaran,
} from "@/api/adminApi";
import { useAdminMetodePembayaranQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function moneyIdr(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function isCashMetode(m: Pick<MetodePembayaranAdmin, "kode">) {
  return m.kode.toUpperCase() === "CASH";
}

const emptyForm = {
  kode: "",
  namaLabel: "",
  adminFee: "0",
  urutan: "0",
  aktif: true,
};

export function AdminPaymentGatewayPage() {
  const qc = useQueryClient();
  const listQ = useAdminMetodePembayaranQuery(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MetodePembayaranAdmin | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(m: MetodePembayaranAdmin) {
    if (isCashMetode(m)) return;
    setEditing(m);
    setForm({
      kode: m.kode,
      namaLabel: m.namaLabel,
      adminFee: String(m.adminFee),
      urutan: String(m.urutan),
      aktif: m.aktif,
    });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const adminFee = Math.max(0, Number(form.adminFee) || 0);
      const urutan = Math.floor(Number(form.urutan) || 0);
      const kode = form.kode.trim().toUpperCase();
      const body = {
        kode,
        namaLabel: form.namaLabel.trim(),
        adminFee,
        urutan,
        aktif: form.aktif,
      };
      if (!kode || !/^[A-Z0-9_-]{1,32}$/.test(kode)) {
        throw new Error("Kode 1–32 karakter: huruf, angka, _ atau -");
      }
      if (!body.namaLabel) throw new Error("Nama tampilan wajib diisi.");
      if (editing) return putAdminMetodePembayaran(editing.id, body);
      return postAdminMetodePembayaran(body);
    },
    onSuccess: () => {
      toast.success(editing ? "Metode diperbarui" : "Metode ditambahkan");
      qc.invalidateQueries({ queryKey: ["admin", "metode-pembayaran"] });
      qc.invalidateQueries({ queryKey: ["metode-pembayaran"] });
      setDialogOpen(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menyimpan"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deleteAdminMetodePembayaran(id),
    onSuccess: () => {
      toast.success("Metode dinonaktifkan");
      qc.invalidateQueries({ queryKey: ["admin", "metode-pembayaran"] });
      qc.invalidateQueries({ queryKey: ["metode-pembayaran"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menonaktifkan"),
  });

  const rows = listQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Cara bayar & biaya admin</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Atur metode pembayaran dan biaya admin per transaksi. Metode <span className="font-medium">CASH</span> bersifat
            sistem (alur tunai tanpa gateway) dan tidak dapat diubah atau dinonaktifkan.
          </p>
        </div>
        <Button className="rounded-lg shrink-0" onClick={openCreate}>
          Tambah metode
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daftar metode</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {listQ.isLoading ? (
            <div className="text-sm text-muted-foreground py-6">Memuat…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="text-right">Biaya admin</TableHead>
                  <TableHead className="text-center">Urutan</TableHead>
                  <TableHead className="text-center">Aktif</TableHead>
                  <TableHead className="text-center">Tanpa gateway</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => {
                  const cash = isCashMetode(m);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.kode}</TableCell>
                      <TableCell>{m.namaLabel}</TableCell>
                      <TableCell className="text-right text-xs">{moneyIdr(Number(m.adminFee))}</TableCell>
                      <TableCell className="text-center">{m.urutan}</TableCell>
                      <TableCell className="text-center">{m.aktif ? "Ya" : "Tidak"}</TableCell>
                      <TableCell className="text-center">{m.tanpaPaymentGateway ? "Ya (CASH)" : "Tidak"}</TableCell>
                      <TableCell className="text-right">
                        {cash ? (
                          <span className="text-xs text-muted-foreground">Sistem</span>
                        ) : (
                          <span className="space-x-2 inline-flex">
                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEdit(m)}>
                              Edit
                            </Button>
                            {m.aktif ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-lg text-destructive"
                                disabled={deactivateMutation.isPending}
                                onClick={() => {
                                  if (!confirm("Nonaktifkan metode ini? Tidak akan muncul di form booking baru.")) return;
                                  deactivateMutation.mutate(m.id);
                                }}
                              >
                                Nonaktifkan
                              </Button>
                            ) : null}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit metode" : "Metode baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="m-kode">Kode</Label>
              <Input
                id="m-kode"
                className="rounded-lg font-mono uppercase"
                value={form.kode}
                onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value.toUpperCase() }))}
                placeholder="QRIS"
                disabled={Boolean(editing)}
              />
              <p className="text-xs text-muted-foreground">Unik, tidak bisa diubah setelah dibuat.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-nama">Nama tampilan</Label>
              <Input
                id="m-nama"
                className="rounded-lg"
                value={form.namaLabel}
                onChange={(e) => setForm((f) => ({ ...f, namaLabel: e.target.value }))}
                placeholder="QRIS / Transfer bank"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="m-fee">Biaya admin (Rp)</Label>
                <Input
                  id="m-fee"
                  type="number"
                  min={0}
                  className="rounded-lg"
                  value={form.adminFee}
                  onChange={(e) => setForm((f) => ({ ...f, adminFee: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-urut">Urutan</Label>
                <Input
                  id="m-urut"
                  type="number"
                  className="rounded-lg"
                  value={form.urutan}
                  onChange={(e) => setForm((f) => ({ ...f, urutan: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.aktif}
                onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.checked }))}
                className={cn("h-4 w-4 rounded border")}
              />
              Aktif (tampil di form booking)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button className="rounded-lg" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
