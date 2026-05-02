import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { patchAdminSettings } from "@/api/adminApi";
import { useAdminSettingsQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GROUPS: Record<string, string[]> = {
  bisnis: ["NamaBisnis", "Alamat", "NoTelepon", "NoWhatsApp"],
  bank: ["NamaBank", "NomorRekening", "NamaRekening", "QrisImagePath"],
  operasional: ["JamBuka", "JamTutup", "PeakHourMulai", "PeakHourSelesai", "MinJamBatalkan", "PersenDP"],
  notifikasi: [
    "WaProvider",
    "CallMeBotApiKey",
    "CallMeBotNoAdmin",
    "TemplateWaBookingUser",
    "TemplateWaBookingAdmin",
    "TemplateWaLunas",
    "TemplateWaReminder",
  ],
};

export function AdminPengaturanPage() {
  const q = useAdminSettingsQuery(true);
  const qc = useQueryClient();
  const [local, setLocal] = useState<Record<string, string>>({});

  const entries = q.data?.entries ?? {};

  useEffect(() => {
    setLocal({ ...entries });
  }, [entries]);

  const flatEntries = useMemo(() => Object.entries(local).map(([key, value]) => ({ key, value })), [local]);

  const save = useMutation({
    mutationFn: () => patchAdminSettings(flatEntries),
    onSuccess: () => {
      toast.success("Pengaturan disimpan");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  function setKey(key: string, value: string) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-lexend text-2xl font-semibold">Pengaturan sistem</h1>

      <Tabs defaultValue="bisnis">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="bisnis">Profil bisnis</TabsTrigger>
          <TabsTrigger value="bank">Bank & QRIS</TabsTrigger>
          <TabsTrigger value="operasional">Operasional</TabsTrigger>
          <TabsTrigger value="notifikasi">Notifikasi WA</TabsTrigger>
        </TabsList>

        {Object.entries(GROUPS).map(([tab, keys]) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{tab}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {keys.map((k) => (
                  <div key={k} className="space-y-1">
                    <Label className="font-mono text-xs">{k}</Label>
                    <Input className="rounded-lg font-mono text-sm" value={local[k] ?? ""} onChange={(e) => setKey(k, e.target.value)} />
                  </div>
                ))}
                <Button className="rounded-lg mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
                  Simpan grup ini
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Token template: {"{nama}"}, {"{lapangan}"}, {"{tanggal}"}, {"{jamMulai}"}, {"{jamSelesai}"}, {"{total}"}, {"{status}"}
      </p>
    </div>
  );
}
