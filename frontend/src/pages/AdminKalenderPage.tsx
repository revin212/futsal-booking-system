import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useAdminKalenderQuery, useAdminLapanganListQuery } from "@/features/admin/queries";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function yyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function AdminKalenderPage() {
  const lapanganQ = useAdminLapanganListQuery(true);
  const [lapanganId, setLapanganId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const startStr = useMemo(() => yyyyMmDd(weekStart), [weekStart]);
  const endStr = useMemo(() => yyyyMmDd(addDays(weekStart, 6)), [weekStart]);

  const kalQ = useAdminKalenderQuery(lapanganId, startStr, endStr, true);

  useEffect(() => {
    if (lapanganQ.data?.length && lapanganId == null) {
      setLapanganId(lapanganQ.data[0].id);
    }
  }, [lapanganQ.data, lapanganId]);

  useEffect(() => {
    if (kalQ.isError) toast.error((kalQ.error as any)?.message ?? "Gagal memuat kalender");
  }, [kalQ.isError, kalQ.error]);

  const events = kalQ.data ?? [];

  const grouped = useMemo(() => {
    const m = new Map<string, typeof events>();
    for (const ev of events) {
      const day = ev.start.slice(0, 10);
      const arr = m.get(day) ?? [];
      arr.push(ev);
      m.set(day, arr);
    }
    return m;
  }, [events]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-lexend text-2xl font-semibold">Kalender Booking</h1>
        <p className="text-sm text-muted-foreground mt-2">Event per minggu dari API kalender admin.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-sm text-muted-foreground shrink-0">Lapangan</span>
          <Select
            value={lapanganId ? String(lapanganId) : ""}
            onValueChange={(v) => setLapanganId(Number(v))}
          >
            <SelectTrigger className="rounded-lg">
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
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-lg" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[12rem] text-center">
            {startStr} — {endStr}
          </span>
          <Button variant="outline" size="icon" className="rounded-lg" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {kalQ.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = addDays(weekStart, i);
            const key = yyyyMmDd(d);
            const dayEvents = grouped.get(key) ?? [];
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{key}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {dayEvents.length === 0 ? (
                    <div className="text-muted-foreground text-xs">Kosong</div>
                  ) : (
                    dayEvents.map((ev, idx) => {
                      const bid = (ev.extendedProps as { bookingId?: number })?.bookingId;
                      return (
                        <div key={idx} className="rounded-lg border p-2" style={{ borderLeftWidth: 4, borderLeftColor: ev.color }}>
                          <div className="font-medium">{ev.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {ev.start.slice(11, 16)} – {ev.end.slice(11, 16)}
                          </div>
                          {bid ? (
                            <Link className="text-xs text-primary underline" to={`/admin/booking/${bid}`}>
                              Detail #{bid}
                            </Link>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
