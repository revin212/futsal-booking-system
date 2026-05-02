import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { patchAdminRefundProcess } from "@/api/adminApi";
import { useAdminRefundListQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";

export function AdminRefundPage() {
  const [tab, setTab] = useState<"PENDING" | "REFUNDED" | "REJECTED">("PENDING");
  const q = useAdminRefundListQuery(tab, true);
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<number | null>(null);
  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [processedAmount, setProcessedAmount] = useState("");
  const [note, setNote] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      patchAdminRefundProcess(selId!, action, processedAmount ? Number(processedAmount) : undefined, note || undefined),
    onSuccess: () => {
      toast.success("Refund diproses");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin", "refund"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  const rows = q.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-lexend text-2xl font-semibold">Refund</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="REFUNDED">Refunded</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>
        {(["PENDING", "REFUNDED", "REJECTED"] as const).map((t) => (
          <TabsContent key={t} value={t}>
            <Card>
              <CardHeader>
                <CardTitle>Daftar • {t}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status booking</TableHead>
                      <TableHead>Refund</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>#{b.id}</TableCell>
                        <TableCell>{b.status}</TableCell>
                        <TableCell>{b.refundStatus ?? "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{b.refundAmount ?? "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button asChild size="sm" variant="outline" className="rounded-lg">
                            <Link to={`/admin/booking/${b.id}`}>Detail</Link>
                          </Button>
                          {t === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                className="rounded-lg"
                                onClick={() => {
                                  setSelId(b.id);
                                  setAction("APPROVE");
                                  setProcessedAmount(String(b.refundAmount ?? ""));
                                  setNote("");
                                  setOpen(true);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-lg"
                                onClick={() => {
                                  setSelId(b.id);
                                  setAction("REJECT");
                                  setProcessedAmount("");
                                  setNote("");
                                  setOpen(true);
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "APPROVE" ? "Setujui refund" : "Tolak refund"}</DialogTitle>
          </DialogHeader>
          {action === "APPROVE" ? (
            <div className="space-y-2">
              <Label>Jumlah diproses (opsional)</Label>
              <Input value={processedAmount} onChange={(e) => setProcessedAmount(e.target.value)} type="number" />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={mut.isPending} onClick={() => mut.mutate()}>
              {mut.isPending ? "..." : "Kirim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
