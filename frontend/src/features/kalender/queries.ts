import { useQuery } from "@tanstack/react-query";
import { getKalenderEvents } from "@/api/kalenderApi";

export function useKalenderEventsQuery(params: {
  lapanganId: number;
  start: string;
  end: string;
}) {
  return useQuery({
    queryKey: ["kalender", params.lapanganId, params.start, params.end],
    queryFn: () => getKalenderEvents(params),
    enabled: Boolean(params.lapanganId && params.start && params.end),
  });
}

