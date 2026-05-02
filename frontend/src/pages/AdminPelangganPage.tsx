import { useState } from "react";
import { Link } from "react-router-dom";

import { useAdminUsersQuery } from "@/features/admin/queries";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminPelangganPage() {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("");
  const [blocked, setBlocked] = useState<string>("");

  const query = useAdminUsersQuery(
    {
      page,
      size: 20,
      q: q.trim() || undefined,
      role: role || undefined,
      blocked: blocked === "" ? undefined : blocked === "true",
    },
    true
  );

  const data = query.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-lexend text-2xl font-semibold">Pelanggan</h1>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3">
          <Input className="max-w-xs rounded-lg" placeholder="Cari email / nama" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={role || "__"} onValueChange={(v) => setRole(v === "__" ? "" : v)}>
            <SelectTrigger className="w-[140px] rounded-lg">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Semua role</SelectItem>
              <SelectItem value="USER">USER</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
          <Select value={blocked || "__"} onValueChange={(v) => setBlocked(v === "__" ? "" : v)}>
            <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue placeholder="Blocked" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Semua</SelectItem>
              <SelectItem value="false">Aktif</SelectItem>
              <SelectItem value="true">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setPage(0)}>
            Terapkan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.content ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.namaLengkap}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Badge variant={u.isBlocked ? "destructive" : "secondary"}>{u.isBlocked ? "Blocked" : "OK"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link to={`/admin/sistem/pelanggan/${u.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <span>
              Total: {data?.totalElements ?? 0} — Halaman {(data?.number ?? 0) + 1}/{Math.max(1, data?.totalPages ?? 1)}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Prev
              </Button>
              <Button size="sm" variant="outline" disabled={data != null && page >= (data.totalPages ?? 1) - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
