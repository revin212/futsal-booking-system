import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useAdminFinanceSummaryQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function AdminPenjualanPage() {
  const [days, setDays] = useState(30);
  const [groupBy, setGroupBy] = useState<"DATE" | "METODE" | "LAPANGAN">("DATE");

  const { start, end } = useMemo(() => {
    const end = new Date();
    const start = addDays(end, -days);
    return { start: fmt(start), end: fmt(end) };
  }, [days]);

  const q = useAdminFinanceSummaryQuery(start, end, groupBy, true);

  const chartData = useMemo(() => {
    const rows = q.data ?? [];
    return rows.map((r) => ({
      name: r.key.length > 14 ? r.key.slice(0, 12) + "…" : r.key,
      paid: Number(r.paidAmount),
    }));
  }, [q.data]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-lexend text-2xl font-semibold">Penjualan</h1>
        <p className="text-sm text-muted-foreground mt-2">Ringkasan booking LUNAS + SELESAI.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[140px] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 hari</SelectItem>
            <SelectItem value="30">30 hari</SelectItem>
            <SelectItem value="90">90 hari</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
          <SelectTrigger className="w-[160px] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DATE">Per tanggal</SelectItem>
            <SelectItem value="METODE">Per metode</SelectItem>
            <SelectItem value="LAPANGAN">Per lapangan</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => q.refetch()}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grafik paid amount</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {q.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value ?? 0);
                    return [new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n), "Paid"];
                  }}
                />
                <Bar dataKey="paid" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabel</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelompok</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data ?? []).map((r) => (
                  <TableRow key={r.key}>
                    <TableCell>{r.key}</TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(r.paidAmount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
