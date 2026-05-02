import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { putAdminLapanganJam } from "@/api/adminApi";
import { useAdminLapanganJamQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function AdminJamOperasionalPage() {
  const { id } = useParams();
  const lapanganId = Number(id);
  const qc = useQueryClient();
  const q = useAdminLapanganJamQuery(lapanganId, Number.isFinite(lapanganId));

  const [rows, setRows] = useState<{ hariKe: number; jamBuka: string; jamTutup: string; isAktif: boolean }[]>([]);

  useEffect(() => {
    const d = q.data;
    if (!d?.length) return;
    setRows(
      d.map((r) => ({
        hariKe: r.hariKe,
        jamBuka: r.jamBuka.slice(0, 5),
        jamTutup: r.jamTutup.slice(0, 5),
        isAktif: r.isAktif,
      }))
    );
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      putAdminLapanganJam(
        lapanganId,
        rows.map((r) => ({
          hariKe: r.hariKe,
          jamBuka: r.jamBuka.length === 5 ? r.jamBuka + ":00" : r.jamBuka,
          jamTutup: r.jamTutup.length === 5 ? r.jamTutup + ":00" : r.jamTutup,
          isAktif: r.isAktif,
        }))
      ),
    onSuccess: () => {
      toast.success("Jam operasional disimpan");
      qc.invalidateQueries({ queryKey: ["admin", "lapangan", lapanganId, "jam"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex justify-between">
        <h1 className="font-lexend text-2xl font-semibold">Jam operasional #{lapanganId}</h1>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/admin/katalog/lapangan">Kembali</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Per hari (0=Min … 6=Sab)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Buka</TableHead>
                <TableHead>Tutup</TableHead>
                <TableHead>Aktif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={r.hariKe}>
                  <TableCell>
                    {HARI[r.hariKe] ?? r.hariKe} ({r.hariKe})
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={r.jamBuka}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...next[idx], jamBuka: e.target.value };
                        setRows(next);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={r.jamTutup}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...next[idx], jamTutup: e.target.value };
                        setRows(next);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={r.isAktif}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...next[idx], isAktif: e.target.checked };
                        setRows(next);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button className="mt-4 rounded-lg" onClick={() => save.mutate()} disabled={save.isPending || !rows.length}>
            Simpan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
