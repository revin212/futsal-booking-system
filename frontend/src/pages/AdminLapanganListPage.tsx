import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteAdminLapangan } from "@/api/adminApi";
import { useAdminLapanganListQuery } from "@/features/admin/queries";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminLapanganListPage() {
  const q = useAdminLapanganListQuery(true);
  const qc = useQueryClient();

  const del = useMutation({
    mutationFn: (id: number) => deleteAdminLapangan(id),
    onSuccess: () => {
      toast.success("Lapangan dihapus / dinonaktifkan");
      qc.invalidateQueries({ queryKey: ["admin", "lapangan"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="font-lexend text-2xl font-semibold">Lapangan</h1>
        <Button asChild className="rounded-lg">
          <Link to="/admin/katalog/lapangan/new">Tambah</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nama}</TableCell>
                  <TableCell>{l.tipe}</TableCell>
                  <TableCell>
                    <Badge variant={l.isAktif ? "default" : "secondary"}>{l.isAktif ? "Aktif" : "Nonaktif"}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link to={`/admin/katalog/lapangan/${l.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link to={`/admin/katalog/lapangan/${l.id}/foto`}>Foto</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link to={`/admin/katalog/lapangan/${l.id}/jam-operasional`}>Jam</Link>
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => del.mutate(l.id)} disabled={del.isPending}>
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
