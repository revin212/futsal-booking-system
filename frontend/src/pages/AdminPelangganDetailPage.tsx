import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { patchAdminUserBlock, patchAdminUserRole } from "@/api/adminApi";
import { useAdminUserDetailQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminPelangganDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const q = useAdminUserDetailQuery(id, Boolean(id));

  const blockMut = useMutation({
    mutationFn: (isBlocked: boolean) => patchAdminUserBlock(id!, isBlocked),
    onSuccess: () => {
      toast.success("Diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      q.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  const roleMut = useMutation({
    mutationFn: (role: string) => patchAdminUserRole(id!, role),
    onSuccess: () => {
      toast.success("Role diubah");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      q.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  const u = q.data?.user;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex justify-between">
        <h1 className="font-lexend text-2xl font-semibold">Detail pelanggan</h1>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/admin/sistem/pelanggan">Kembali</Link>
        </Button>
      </div>

      {!u ? (
        <div className="text-sm text-muted-foreground">{q.isLoading ? "Memuat…" : "Tidak ditemukan"}</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{u.namaLengkap}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span> {u.email}
              </div>
              <div>
                <span className="text-muted-foreground">Role:</span>{" "}
                <Select value={u.role} onValueChange={(v) => roleMut.mutate(v)}>
                  <SelectTrigger className="inline-flex w-[140px] h-8 ml-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Blocked:</span>
                <Button size="sm" variant={u.isBlocked ? "destructive" : "outline"} className="rounded-lg" onClick={() => blockMut.mutate(!u.isBlocked)}>
                  {u.isBlocked ? "Unblock" : "Block"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data?.recentBookings ?? []).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <Link className="text-primary underline" to={`/admin/booking/${b.id}`}>
                          #{b.id}
                        </Link>
                      </TableCell>
                      <TableCell>{b.status}</TableCell>
                      <TableCell>{b.tanggalMain}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
