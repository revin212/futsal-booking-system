import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { postAdminNotificationResend } from "@/api/adminApi";
import { useAdminNotificationLogQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminNotifikasiPage() {
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const notifQ = useAdminNotificationLogQuery({
    limit: 200,
    enabled: true,
    notificationType: type || undefined,
    from: from || undefined,
    to: to || undefined,
  });
  const qc = useQueryClient();

  const resend = useMutation({
    mutationFn: (id: number) => postAdminNotificationResend(id),
    onSuccess: () => {
      toast.success("Notifikasi dikirim ulang (log baru)");
      qc.invalidateQueries({ queryKey: ["admin", "notification-log"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal resend"),
  });

  const notif = notifQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-lexend text-2xl font-semibold">Log Notifikasi</h1>
        <p className="text-sm text-muted-foreground mt-2">Filter dan kirim ulang (WhatsApp mock / provider).</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Tipe</div>
            <Input className="rounded-lg w-48" value={type} onChange={(e) => setType(e.target.value)} placeholder="BOOKING_CREATED …" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Dari</div>
            <Input type="date" className="rounded-lg" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Sampai</div>
            <Input type="date" className="rounded-lg" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {notif.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.id}</TableCell>
                  <TableCell className="text-xs">{n.notificationType}</TableCell>
                  <TableCell className="text-xs">{n.deliveryStatus ?? "-"}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{n.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => resend.mutate(n.id)}>
                      Resend
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-2">
            {notif.slice(0, 30).map((n) => (
              <details key={`m-${n.id}`} className="text-sm border rounded-lg p-2">
                <summary className="cursor-pointer font-medium">#{n.id} • {n.notificationType}</summary>
                <div className="mt-2 text-muted-foreground whitespace-pre-wrap">{n.message}</div>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
