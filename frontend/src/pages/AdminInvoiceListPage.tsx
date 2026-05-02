import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAdminFinanceInvoicesQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function AdminInvoiceListPage() {
  const [days, setDays] = useState(90);
  const { start, end } = useMemo(() => {
    const end = new Date();
    const start = addDays(end, -days);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }, [days]);

  const q = useAdminFinanceInvoicesQuery(start, end, true);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Invoice</h1>
          <p className="text-sm text-muted-foreground mt-2">Booking dengan nomor invoice pada rentang tanggal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={days === 30 ? "default" : "outline"} size="sm" className="rounded-lg" onClick={() => setDays(30)}>
            30 hari
          </Button>
          <Button variant={days === 90 ? "default" : "outline"} size="sm" className="rounded-lg" onClick={() => setDays(90)}>
            90 hari
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((b) => (
                <TableRow key={b.id}>
                  <TableCell>#{b.id}</TableCell>
                  <TableCell className="font-mono text-xs">{b.invoiceNumber}</TableCell>
                  <TableCell>{b.tanggalMain}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link to={`/invoice/${b.id}`} target="_blank" rel="noreferrer">
                        Lihat invoice
                      </Link>
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
