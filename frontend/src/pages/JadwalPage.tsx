import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { useLapanganListQuery } from "@/features/lapangan/queries";
import { useKalenderEventsQuery } from "@/features/kalender/queries";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function JadwalPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const lapanganQ = useLapanganListQuery();

  const initialLapanganId = useMemo(() => {
    const fromQs = Number(sp.get("lapanganId"));
    if (Number.isFinite(fromQs) && fromQs > 0) return fromQs;
    return null;
  }, [sp]);

  const [lapanganId, setLapanganId] = useState<number | null>(initialLapanganId);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    if (lapanganId != null) return;
    const first = lapanganQ.data?.[0]?.id;
    if (first) setLapanganId(first);
  }, [lapanganId, lapanganQ.data]);

  const eventsQ = useKalenderEventsQuery({
    lapanganId: lapanganId ?? 0,
    start: range?.start ?? "",
    end: range?.end ?? "",
  });

  useEffect(() => {
    if (lapanganQ.isError) toast.error((lapanganQ.error as any)?.message ?? "Gagal memuat lapangan");
  }, [lapanganQ.isError, lapanganQ.error]);

  useEffect(() => {
    if (eventsQ.isError) toast.error((eventsQ.error as any)?.message ?? "Gagal memuat kalender");
  }, [eventsQ.isError, eventsQ.error]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-lexend text-2xl font-semibold">Jadwal</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Pilih lapangan, lalu klik slot kosong untuk mulai booking (placeholder).
          </p>
        </div>

        <div className="w-full sm:w-[320px]">
          {lapanganQ.isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <Select
              value={lapanganId ? String(lapanganId) : undefined}
              onValueChange={(v) => {
                const next = Number(v);
                setLapanganId(next);
                sp.set("lapanganId", String(next));
                setSp(sp, { replace: true });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih lapangan" />
              </SelectTrigger>
              <SelectContent>
                {(lapanganQ.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-2 sm:p-4">
        {eventsQ.isLoading && !eventsQ.data ? (
          <div className="p-4">
            <Skeleton className="h-8 w-40" />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            height="auto"
            events={eventsQ.data ?? []}
            datesSet={(arg) => {
              const start = arg.startStr.slice(0, 10);
              const end = arg.endStr.slice(0, 10);
              setRange({ start, end });
            }}
            dateClick={(arg) => {
              if (!lapanganId) return;
              const tanggal = arg.dateStr.slice(0, 10);
              const jam = arg.dateStr.includes("T") ? arg.dateStr.slice(11, 16) : "07:00";
              navigate(`/booking/new?lapanganId=${lapanganId}&tanggal=${tanggal}&jam=${jam}`);
            }}
          />
        )}
      </div>
    </div>
  );
}

