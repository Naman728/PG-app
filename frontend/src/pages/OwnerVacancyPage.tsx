import { useVirtualizer } from "@tanstack/react-virtual";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { VacancyOpsRoomCard, type VacancyRow } from "../components/vacancy/VacancyOpsRoomCard";
import { VacancyRoomDetailSheet } from "../components/vacancy/VacancyRoomDetailSheet";
import { VacancyShareSheet } from "../components/vacancy/VacancyShareSheet";
import { ROUTES } from "../constants/routes";
import { useSessionQuery } from "../hooks/useSessionQuery";
import { OwnerShell } from "../layouts/OwnerShell";
import { roomMatchesVacancyFilter, vacantBedCount, type VacancyFilter } from "../lib/room-display";
import { fetchFloorMap, floorMapQueryKey, updateBedApi } from "../services/property.api";
import type { PropertyMapFloor, PropertyMapRoom } from "../types/property";

function buildVacancyRows(floors: PropertyMapFloor[]): VacancyRow[] {
  const out: VacancyRow[] = [];
  for (const floor of floors) {
    for (const room of floor.rooms) {
      if (vacantBedCount(room) > 0) out.push({ floor, room });
    }
  }
  return out;
}

const FILTER_TABS: { key: VacancyFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "fully_vacant", label: "Fully vacant" },
  { key: "partial", label: "Partial" },
  { key: "ready", label: "Ready" },
  { key: "overdue", label: "Overdue" },
  { key: "maintenance", label: "Maint." },
];

export function OwnerVacancyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [detailRow, setDetailRow] = useState<VacancyRow | null>(null);

  const floors = useMemo(() => mapQuery.data?.floors ?? [], [mapQuery.data?.floors]);

  const rows = useMemo(() => {
    const base = buildVacancyRows(floors).filter(({ room }) => roomMatchesVacancyFilter(room, filter));
    base.sort((a, b) => {
      const fa = a.floor.name.localeCompare(b.floor.name);
      if (fa !== 0) return fa;
      return a.room.name.localeCompare(b.room.name, undefined, { numeric: true });
    });
    return base;
  }, [floors, filter]);

  const counts = useMemo(() => {
    const allRows = buildVacancyRows(floors);
    const tally: Partial<Record<VacancyFilter, number>> = {};
    for (const t of FILTER_TABS) {
      tally[t.key] = allRows.filter(({ room }) => roomMatchesVacancyFilter(room, t.key)).length;
    }
    return tally as Record<VacancyFilter, number>;
  }, [floors]);

  const markVacantMaintenanceMut = useMutation({
    mutationFn: async (room: PropertyMapRoom) => {
      const targets = room.beds.filter((b) => b.status === "VACANT");
      if (!targets.length) throw new Error("No vacant bed to update");
      const note = "Marked from Vacancy board";
      for (const b of targets) {
        await updateBedApi(orgId!, b.id, { status: "UNDER_MAINTENANCE", maintenanceNote: note });
      }
    },
    onSuccess: async () => {
      toast.success("Vacant beds marked under maintenance");
      await queryClient.invalidateQueries({ queryKey: floorMapQueryKey(orgId) });
      setDetailRow(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const goMap = useCallback(
    (roomId: string) => {
      navigate(`${ROUTES.ownerProperty}?room=${encodeURIComponent(roomId)}`);
    },
    [navigate],
  );

  const parentRef = useRef<HTMLDivElement>(null);

  // TanStack Virtual: intentional; list size is bounded by filtered rows.
  // eslint-disable-next-line react-hooks/incompatible-library -- virtualizer API is stable for this scroll container
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 212,
    overscan: 8,
  });

  const onMarkMaint = useCallback(
    (room: PropertyMapRoom) => {
      const vac = vacantBedCount(room);
      if (
        !window.confirm(
          `Mark all ${vac} vacant bed${vac === 1 ? "" : "s"} in “${room.name}” as under maintenance?`,
        )
      ) {
        return;
      }
      markVacantMaintenanceMut.mutate(room);
    },
    [markVacantMaintenanceMut],
  );

  return (
    <OwnerShell title="Vacancy" contentMaxClassName="max-w-7xl">
      {!orgId ? (
        <p className="text-sm text-slate-600">No organization linked.</p>
      ) : (
        <div className="space-y-4 md:space-y-6">
          <div className="hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.04] md:block md:p-5">
            <p className="text-sm font-semibold text-slate-900">Operational vacancy board</p>
            <p className="mt-1 text-sm text-slate-600">
              Built from live floor data — red cards are easy walk-in wins; amber is partial; dark red flags overdue
              while beds sit empty; gray is maintenance.
            </p>
          </div>

          <div className="sticky top-0 z-30 -mx-4 border-b border-slate-200/90 bg-[#f4f6f5]/98 px-4 py-3 shadow-sm backdrop-blur-md md:static md:mx-0 md:rounded-2xl md:border md:border-slate-200/90 md:bg-white md:shadow-sm md:backdrop-blur-none">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Live openings</p>
                <p className="text-2xl font-bold tabular-nums text-slate-950">{counts.all}</p>
                <p className="text-xs text-slate-500">rooms with ≥1 free bed</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-11 shrink-0 font-semibold"
                disabled={mapQuery.isFetching}
                onClick={() => void mapQuery.refetch()}
              >
                {mapQuery.isFetching ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={[
                    "shrink-0 snap-start rounded-full border px-3.5 py-2.5 text-xs font-bold transition sm:text-sm",
                    filter === key
                      ? "border-[#1a4d32] bg-[#1a4d32] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300",
                  ].join(" ")}
                >
                  {label}
                  <span className="ml-1 tabular-nums opacity-80">({counts[key] ?? 0})</span>
                </button>
              ))}
            </div>
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
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          ) : !rows.length ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-600">
              No vacancies match this filter.
            </div>
          ) : (
            <div
              ref={parentRef}
              className="h-[min(68dvh,calc(100dvh-220px))] overflow-y-auto overscroll-contain md:h-[min(640px,calc(100vh-240px))]"
            >
              <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((vi) => {
                  const row = rows[vi.index]!;
                  return (
                    <div
                      key={vi.key}
                      data-index={vi.index}
                      ref={virtualizer.measureElement}
                      className="absolute left-0 top-0 w-full px-0 pb-3"
                      style={{ transform: `translateY(${vi.start}px)` }}
                    >
                      <VacancyOpsRoomCard
                        row={row}
                        onShare={() => setShareRow(row)}
                        onOpenDetail={() => setDetailRow(row)}
                        onViewMap={() => goMap(row.room.id)}
                        onAssign={() => goMap(row.room.id)}
                        onMarkMaintenance={() => onMarkMaint(row.room)}
                        maintenanceBusy={markVacantMaintenanceMut.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {shareRow ? (
            <VacancyShareSheet
              row={shareRow}
              orgName={orgName}
              contact={contact}
              onClose={() => setShareRow(null)}
            />
          ) : null}

          {detailRow ? (
            <VacancyRoomDetailSheet
              row={detailRow}
              orgName={orgName}
              contact={contact}
              onClose={() => setDetailRow(null)}
              onShare={() => {
                const r = detailRow;
                setDetailRow(null);
                setShareRow(r);
              }}
              onViewMap={() => {
                const id = detailRow.room.id;
                setDetailRow(null);
                goMap(id);
              }}
              onAssign={() => {
                const id = detailRow.room.id;
                setDetailRow(null);
                goMap(id);
              }}
              onMarkMaintenance={() => onMarkMaint(detailRow.room)}
              maintenanceBusy={markVacantMaintenanceMut.isPending}
            />
          ) : null}
        </div>
      )}
    </OwnerShell>
  );
}
