import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteAdminLapanganFoto, patchAdminLapanganFotoUtama, postAdminLapanganFoto } from "@/api/adminApi";
import { useAdminLapanganFotosQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminFotoLapanganPage() {
  const { id } = useParams();
  const lapanganId = Number(id);
  const qc = useQueryClient();
  const q = useAdminLapanganFotosQuery(lapanganId, Number.isFinite(lapanganId));
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => postAdminLapanganFoto(lapanganId, file),
    onSuccess: () => {
      toast.success("Foto diupload");
      qc.invalidateQueries({ queryKey: ["admin", "lapangan", lapanganId, "foto"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal upload"),
  });

  const setUtama = useMutation({
    mutationFn: (fotoId: number) => patchAdminLapanganFotoUtama(lapanganId, fotoId),
    onSuccess: () => {
      toast.success("Foto utama diubah");
      qc.invalidateQueries({ queryKey: ["admin", "lapangan", lapanganId, "foto"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  const remove = useMutation({
    mutationFn: (fotoId: number) => deleteAdminLapanganFoto(lapanganId, fotoId),
    onSuccess: () => {
      toast.success("Foto dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "lapangan", lapanganId, "foto"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal"),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex justify-between">
        <h1 className="font-lexend text-2xl font-semibold">Foto lapangan #{lapanganId}</h1>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/admin/katalog/lapangan">Kembali</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" className="rounded-lg" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            Pilih file
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {(q.data ?? []).map((f) => (
          <Card key={f.id}>
            <CardContent className="pt-4 space-y-2">
              <img src={f.filePath} alt="" className="w-full aspect-video object-cover rounded-lg border" />
              <div className="text-xs text-muted-foreground">{f.isUtama ? "Utama" : ""}</div>
              <div className="flex gap-2">
                {!f.isUtama ? (
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setUtama.mutate(f.id)}>
                    Jadikan utama
                  </Button>
                ) : null}
                <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => remove.mutate(f.id)}>
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
