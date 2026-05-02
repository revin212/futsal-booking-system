import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getLapanganDetail } from "@/api/lapanganApi";
import { postAdminLapangan, putAdminLapangan } from "@/api/adminApi";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLapanganFormPage() {
  const params = useParams();
  const location = useLocation();
  const id = params.id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = Boolean(location.pathname.endsWith("/lapangan/new"));

  const detailQ = useQuery({
    queryKey: ["lapangan", "admin", "detail", id],
    queryFn: () => getLapanganDetail(Number(id)),
    enabled: !isNew && Boolean(id),
  });

  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState("Vinyl");
  const [deskripsi, setDeskripsi] = useState("");
  const [fasilitasText, setFasilitasText] = useState('["Parkir"]');
  const [hargaRegular, setHargaRegular] = useState("150000");
  const [hargaPeakHour, setHargaPeakHour] = useState("180000");
  const [hargaWeekend, setHargaWeekend] = useState("170000");
  const [isAktif, setIsAktif] = useState(true);

  useEffect(() => {
    const d = detailQ.data;
    if (!d) return;
    setNama(d.nama);
    setTipe(d.tipe);
    setDeskripsi(d.deskripsi ?? "");
    setFasilitasText(d.fasilitas || "[]");
    setHargaRegular(String(d.hargaRegular));
    setHargaPeakHour(String(d.hargaPeakHour));
    setHargaWeekend(String(d.hargaWeekend));
    setIsAktif(d.isAktif);
  }, [detailQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      let fasilitas: string[] = [];
      try {
        fasilitas = JSON.parse(fasilitasText) as string[];
      } catch {
        throw new Error("Fasilitas harus JSON array string, mis. [\"Parkir\"]");
      }
      const body = {
        nama,
        tipe,
        deskripsi: deskripsi || null,
        fasilitas,
        hargaRegular: Number(hargaRegular),
        hargaPeakHour: Number(hargaPeakHour),
        hargaWeekend: Number(hargaWeekend),
        isAktif,
      };
      if (isNew) return postAdminLapangan(body);
      return putAdminLapangan(Number(id), body);
    },
    onSuccess: (res: { id: number }) => {
      toast.success(isNew ? "Lapangan dibuat" : "Disimpan");
      qc.invalidateQueries({ queryKey: ["admin", "lapangan"] });
      if (isNew) navigate(`/admin/katalog/lapangan/${res.id}/edit`, { replace: true });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal simpan"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-lexend text-2xl font-semibold">{isNew ? "Lapangan baru" : "Edit lapangan"}</h1>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/admin/katalog/lapangan">Kembali</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Nama</Label>
            <Input value={nama} onChange={(e) => setNama(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label>Tipe</Label>
            <Input value={tipe} onChange={(e) => setTipe(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label>Deskripsi</Label>
            <Input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label>Fasilitas (JSON array)</Label>
            <Input value={fasilitasText} onChange={(e) => setFasilitasText(e.target.value)} className="rounded-lg font-mono text-xs" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label>Regular</Label>
              <Input value={hargaRegular} onChange={(e) => setHargaRegular(e.target.value)} type="number" className="rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label>Peak</Label>
              <Input value={hargaPeakHour} onChange={(e) => setHargaPeakHour(e.target.value)} type="number" className="rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label>Weekend</Label>
              <Input value={hargaWeekend} onChange={(e) => setHargaWeekend(e.target.value)} type="number" className="rounded-lg" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isAktif} onChange={(e) => setIsAktif(e.target.checked)} />
            Aktif
          </label>
          <Button className="rounded-lg" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
