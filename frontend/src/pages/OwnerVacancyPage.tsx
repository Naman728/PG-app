import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { OperationalRoomCard } from "../components/property/OperationalRoomCard";
import { OPERATIONAL_LEGEND, operationalBedChipClass } from "../components/property/operational-map-styles";
import { Button } from "../components/ui/button";
import { OwnerShell } from "../layouts/OwnerShell";
import {
  amenitiesHint,
  daysSinceVacantHint,
  formatRupees,
  readyForMoveIn,
  rentPerSpaceMinor,
  roomMatchesVacancyFilter,
  vacantBedCount,
  type VacancyFilter,
} from "../lib/room-display";
import { buildVacancyShareText } from "../lib/share-vacancy";
import { useSessionQuery } from "../hooks/useSessionQuery";
import { fetchFloorMap, floorMapQueryKey } from "../services/property.api";
import type { PropertyMapFloor, PropertyMapRoom } from "../types/property";

type VacancyRow = { floor: PropertyMapFloor; room: PropertyMapRoom };

function buildVacancyRows(floors: PropertyMapFloor[]): VacancyRow[] {
  const out: VacancyRow[] = [];
  for (const floor of floors) {
    for (const room of floor.rooms) {
      if (vacantBedCount(room) > 0) out.push({ floor, room });
    }
  }
  return out;
}

export function OwnerVacancyPage() {
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;
  const orgName = session.data?.primaryOrganization?.name ?? "Our PG";
  const contact = session.data?.phone?.trim() || session.data?.email?.trim() || "";

  const mapQuery = useQuery({
    queryKey: floorMapQueryKey(orgId),
    queryFn: async () => {
      const { floors } = await fetchFloorMap(orgId!);
      return { floors };
    },
    enabled: Boolean(orgId),
    refetchInterval: (q) => (q.state.status === "error" ? false : 15_000),
  });

  const [filter, setFilter] = useState<VacancyFilter>("all");
  const [shareRow, setShareRow] = useState<VacancyRow | null>(null);

  const rows = useMemo(() => {
    const floors = mapQuery.data?.floors ?? [];
    const base = buildVacancyRows(floors).filter(({ room }) => roomMatchesVacancyFilter(room, filter));
    return base;
  }, [mapQuery.data?.floors, filter]);

  async function copyShare(row: VacancyRow) {
    const text = buildVacancyShareText({
      orgName,
      floorName: row.floor.name,
      room: row.room,
      contact,
    });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied — paste in WhatsApp");
    } catch {
      toast.error("Could not copy — select text manually");
    }
    setShareRow(null);
  }

  return (
    <OwnerShell title="Vacancy" contentMaxClassName="max-w-7xl">
      {!orgId ? (
        <p className="text-sm text-slate-600">No organization linked.</p>
      ) : (
        <div className="space-y-6">
          <p className="text-base text-slate-600">
            Same card view as the floor map — only rooms with free beds. Ideal for walk-ins and WhatsApp leads.
          </p>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.04] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colours</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {OPERATIONAL_LEGEND.map(({ tone, label }) => (
                <div key={tone} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${operationalBedChipClass(tone)}`}
                  >
                    ·
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="sticky top-0 z-20 -mx-4 flex flex-wrap gap-2 border-b border-slate-200/90 bg-[#f4f6f5]/95 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:rounded-2xl md:border md:border-slate-200/90 md:bg-white md:backdrop-blur-none">
            {(
              [
                ["all", "All vacant spaces"],
                ["fully_vacant", "Fully empty"],
                ["partial", "Partly filled"],
                ["ready", "Ready for move-in"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={[
                  "min-h-11 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                  filter === key
                    ? "border-[#1a4d32] bg-[#1a4d32] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {mapQuery.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 p-5 shadow-sm ring-1 ring-red-100">
              <p className="text-sm font-semibold text-red-950">Vacancy data sync failed</p>
              <p className="mt-2 text-sm text-red-900/90">
                {(mapQuery.error as Error)?.message?.trim() || "We could not refresh vacancies from the server."}
              </p>
              <Button
                type="button"
                className="mt-4 h-11 bg-[#1a4d32] text-white hover:bg-[#143d28]"
                disabled={mapQuery.isFetching}
                onClick={() => void mapQuery.refetch()}
              >
                {mapQuery.isFetching ? "Retrying…" : "Retry"}
              </Button>
            </div>
          ) : mapQuery.isPending && !mapQuery.data ? (
            <div className="space-y-3">
              <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          ) : !rows.length ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
              No vacancies match this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map(({ floor, room }) => {
                const vac = vacantBedCount(room);
                const vacantBeds = room.beds.filter((b) => b.status === "VACANT");
                const oldestHint = vacantBeds
                  .map((b) => daysSinceVacantHint(b))
                  .filter((d): d is number => d != null);
                const daysHint = oldestHint.length ? Math.max(...oldestHint) : null;
                return (
                  <article
                    key={room.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-black/[0.04]"
                  >
                    <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {floor.name}
                    </p>
                    <OperationalRoomCard
                      room={room}
                      dimmed={false}
                      onSelect={() => setShareRow({ floor, room })}
                    />
                    <ul className="space-y-1 rounded-xl bg-slate-50/90 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200/80">
                      <li>
                        <span className="font-semibold text-slate-900">{vac}</span> bed{vac === 1 ? "" : "s"} free
                      </li>
                      <li>{formatRupees(rentPerSpaceMinor(room))} / space</li>
                      <li>{amenitiesHint(room)}</li>
                      <li>{readyForMoveIn(room) ? "Ready to move in" : "Check status"}</li>
                      <li className="text-slate-500">Vacant ~{daysHint != null ? `${daysHint}d` : "—"}</li>
                    </ul>
                    <Button type="button" className="w-full bg-[#1a4d32] text-white hover:bg-[#143d28]" onClick={() => setShareRow({ floor, room })}>
                      Share vacancy
                    </Button>
                  </article>
                );
              })}
            </div>
          )}

          {shareRow ? (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setShareRow(null);
              }}
            >
              <div
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-slate-900">Share on WhatsApp</h3>
                <p className="mt-1 text-sm text-slate-600">Copy this text and paste into a student chat.</p>
                <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-800 ring-1 ring-slate-200">
                  {buildVacancyShareText({
                    orgName,
                    floorName: shareRow.floor.name,
                    room: shareRow.room,
                    contact,
                  })}
                </pre>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" className="flex-1" onClick={() => void copyShare(shareRow)}>
                    Copy text
                  </Button>
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShareRow(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </OwnerShell>
  );
}
