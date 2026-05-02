import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { patchAdminPassword } from "@/api/adminApi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminProfilPage() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const mut = useMutation({
    mutationFn: () => patchAdminPassword(oldPw, newPw),
    onSuccess: () => {
      toast.success("Password diubah");
      setOldPw("");
      setNewPw("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-lexend text-2xl font-semibold">Profil admin</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ubah password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Password lama</Label>
            <Input type="password" className="rounded-lg" value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="space-y-1">
            <Label>Password baru</Label>
            <Input type="password" className="rounded-lg" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
          </div>
          <Button className="rounded-lg w-full" disabled={mut.isPending || !oldPw || newPw.length < 8} onClick={() => mut.mutate()}>
            {mut.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
