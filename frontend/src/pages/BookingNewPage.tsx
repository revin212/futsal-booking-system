import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function BookingNewPage() {
  const [sp] = useSearchParams();

  const info = useMemo(() => {
    const lapanganId = sp.get("lapanganId");
    const tanggal = sp.get("tanggal");
    const jam = sp.get("jam");
    return { lapanganId, tanggal, jam };
  }, [sp]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-lexend text-2xl font-semibold">Booking Baru</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Placeholder (Phase 3 akan jadi wizard booking).
      </p>

      <div className="mt-6 rounded-xl border bg-card p-4 space-y-2">
        <div className="text-sm">
          <span className="text-muted-foreground">lapanganId:</span>{" "}
          <span className="font-semibold">{info.lapanganId ?? "-"}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">tanggal:</span>{" "}
          <span className="font-semibold">{info.tanggal ?? "-"}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">jam:</span>{" "}
          <span className="font-semibold">{info.jam ?? "-"}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Button asChild className="rounded-lg">
          <Link to="/lapangan">Kembali ke Katalog</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/jadwal">Kembali ke Jadwal</Link>
        </Button>
      </div>
    </div>
  );
}

