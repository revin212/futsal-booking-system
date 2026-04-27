import { apiFetch } from "@/api/http";

export type KalenderEvent = {
  title: string;
  start: string;
  end: string;
  color?: string;
  extendedProps?: Record<string, unknown>;
};

export async function getKalenderEvents(params: {
  lapanganId: number;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}) {
  const qs = new URLSearchParams({
    lapanganId: String(params.lapanganId),
    start: params.start,
    end: params.end,
  });
  return apiFetch<KalenderEvent[]>(`/kalender?${qs.toString()}`);
}

