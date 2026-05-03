import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { downloadAdminBookingCsv } from "@/api/adminApi";
import { useAdminFinanceReportQuery } from "@/features/admin/queries";
import { downloadBlob } from "@/lib/download";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminReportPage() {
  const [days] = useState(30);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const { start, end } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }, [days]);

  const q = useAdminFinanceReportQuery(start, end, true);
  const r = q.data;

  const chartRev = useMemo(
    () =>
      (r?.revenuePerLapangan ?? []).map((x) => ({
        name: x.lapanganNama.length > 12 ? x.lapanganNama.slice(0, 10) + "…" : x.lapanganNama,
        revenue: Number(x.revenue),
      })),
    [r]
  );

  const dowLabel = (d: number) => ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d] ?? String(d);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Report</h1>
          <p className="text-sm text-muted-foreground mt-2">Ringkasan {days} hari terakhir.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={downloadingCsv}
            onClick={async () => {
              try {
                setDownloadingCsv(true);
                const res = await downloadAdminBookingCsv(start, end);
                downloadBlob(res.blob, res.filename ?? `booking-${start}-to-${end}.csv`);
                toast.success("CSV booking berhasil diunduh");
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Gagal mengunduh CSV");
              } finally {
                setDownloadingCsv(false);
              }
            }}
          >
            {downloadingCsv ? "Mengunduh…" : "Download CSV"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => q.refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {q.isLoading || !r ? (
        <div className="text-sm text-muted-foreground">Memuat…</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total revenue</CardTitle>
              </CardHeader>
              <CardContent className="font-lexend text-2xl font-semibold">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(r.totalRevenue))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total booking</CardTitle>
              </CardHeader>
              <CardContent className="font-lexend text-2xl font-semibold">{r.totalBookings}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Avg occupancy (est.)</CardTitle>
              </CardHeader>
              <CardContent className="font-lexend text-2xl font-semibold">{r.avgOccupancyPercent}%</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue per lapangan</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRev}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => {
                      const n = typeof value === "number" ? value : Number(value ?? 0);
                      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak hour (jam × hari)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead className="text-right">Booking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(r.peakHourHeatmap ?? []).map((c, i) => (
                    <TableRow key={`${c.dayOfWeek}-${c.hour}-${i}`}>
                      <TableCell>{dowLabel(c.dayOfWeek)}</TableCell>
                      <TableCell>{c.hour}:00</TableCell>
                      <TableCell className="text-right">{c.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>No. WhatsApp</TableHead>
                    <TableHead className="text-right">Total paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(r.topCustomers ?? []).map((c, i) => (
                    <TableRow key={`${c.namaLengkap}-${i}`}>
                      <TableCell>{c.namaLengkap}</TableCell>
                      <TableCell className="text-xs">{c.noWhatsapp}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(c.totalPaid))}
                      </TableCell>
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
