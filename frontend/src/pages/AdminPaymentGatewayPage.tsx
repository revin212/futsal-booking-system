import { Link } from "react-router-dom";

import { useAdminPaymentIntentsQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

export function AdminPaymentGatewayPage() {
  const [status, setStatus] = useState("");
  const q = useAdminPaymentIntentsQuery({ status: status || undefined }, true);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-lexend text-2xl font-semibold">Payment Gateway (Mock)</h1>
        <p className="text-sm text-muted-foreground mt-2">Daftar payment intent — buka halaman mock gateway untuk uji bayar.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter status</CardTitle>
        </CardHeader>
        <CardContent>
          <Input className="max-w-xs rounded-lg" placeholder="PENDING | SUCCESS | FAILED | EXPIRED" value={status} onChange={(e) => setStatus(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell>#{p.bookingId}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(p.amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link to={`/payment-gateway/${p.id}`} target="_blank" rel="noreferrer">
                        Buka gateway
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
