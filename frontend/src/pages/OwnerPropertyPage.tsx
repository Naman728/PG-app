import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createFloorDto,
  type CreateBedInput,
  type CreateFloorInput,
  type CreateRoomInput,
  type UpdateRoomLayoutInput,
} from "@pg-manager/shared";
import { z } from "zod";
import { NavLink, useSearchParams } from "react-router-dom";
import { BedCard } from "../components/property/BedCard";
import { FloorMapGrid } from "../components/property/FloorMapGrid";
import { OperationalFloorMap } from "../components/property/OperationalFloorMap";
import { PropertyStatsBanner } from "../components/property/PropertyStatsBanner";
import { RoomDraftSpreadsheet, type DraftRoomRow } from "../components/property/RoomDraftSpreadsheet";
import { SavedRoomsTable } from "../components/property/SavedRoomsTable";
import type { MapVacancyFilter } from "../lib/bed-visual";
import { flattenRoomsByFloor } from "../lib/room-display";
import { buildVacancyShareText } from "../lib/share-vacancy";
import { ROUTES } from "../constants/routes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useSessionQuery } from "../hooks/useSessionQuery";
import { OwnerShell } from "../layouts/OwnerShell";
import {
  assignBedApi,
  createBedApi,
  createFloorApi,
  createRoomApi,
  deleteFloorApi,
  deleteRoomApi,
  fetchFloorMap,
  fetchPropertyStats,
  floorMapQueryKey,
  fetchPropertyTenantMembers,
  markBedPaidApi,
  updateBedApi,
  updateRoomApi,
  vacateBedApi,
} from "../services/property.api";
import type { BedStatus, PropertyMapFloor, PropertyMapRoom } from "../types/property";

type FloorForm = z.infer<typeof createFloorDto>;

const addBedFormSchema = z.object({
  label: z.string().min(1).max(20),
  rentRupees: z.coerce.number().min(0),
});
type AddBedForm = z.infer<typeof addBedFormSchema>;

function nextRoomPlacement(floor: PropertyMapFloor): CreateRoomInput {
  let maxRow = 1;
  for (const r of floor.rooms) {
    maxRow = Math.max(maxRow, r.rowStart + r.rowSpan - 1);
  }
  const gridColumns = Math.max(1, Math.floor(Number(floor.gridColumns)) || 12);
  const colSpan = Math.min(3, Math.max(1, gridColumns));
  return {
    name: `Room ${floor.rooms.length + 1}`,
    colStart: 1,
    colSpan,
    rowStart: maxRow + 1,
    rowSpan: 2,
  };
}

export function OwnerPropertyPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;
  const orgRole = session.data?.primaryOrganization?.orgRole;
  const canStructure = orgRole === "OWNER" || orgRole === "MANAGER";

  const [statusFilter, setStatusFilter] = useState<BedStatus | "ALL">("ALL");
  const [mapVacancyFilter, setMapVacancyFilter] = useState<MapVacancyFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [arrangeMode, setArrangeMode] = useState(false);
  const dragRoomRef = useRef<PropertyMapRoom | null>(null);

  const [busyBedId, setBusyBedId] = useState<string | null>(null);

  const mapQuery = useQuery({
    queryKey: floorMapQueryKey(orgId),
    queryFn: async () => {
      const { floors } = await fetchFloorMap(orgId!);
      return { floors };
    },
    enabled: Boolean(orgId),
    /** Stop polling while broken — avoids repeating the same error every few seconds. */
    refetchInterval: (q) => (q.state.status === "error" ? false : 6_000),
  });

  const statsQuery = useQuery({
    queryKey: ["property-stats", orgId],
    queryFn: () => fetchPropertyStats(orgId!),
    enabled: Boolean(orgId),
    refetchInterval: (q) => (q.state.status === "error" ? false : 8_000),
  });

  const tenantsQuery = useQuery({
    queryKey: ["property-tenants", orgId],
    queryFn: () => fetchPropertyTenantMembers(orgId!),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });

  const floors = useMemo(() => mapQuery.data?.floors ?? [], [mapQuery.data?.floors]);

  const dismissRoomPanel = useCallback(() => {
    setSelectedRoomId(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!next.has("room")) return prev;
        next.delete("room");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    const roomId = searchParams.get("room");
    if (!roomId || !floors.length) return;
    const exists = floors.some((f) => f.rooms.some((r) => r.id === roomId));
    if (exists) {
      // Sync deep-link (?room=) from router to local panel state when the floor map loads.
      queueMicrotask(() => setSelectedRoomId(roomId));
    }
  }, [floors, searchParams]);

  const [setupFloorId, setSetupFloorId] = useState<string | null>(null);
  const selectedFloorIdForSetup = useMemo(() => {
    if (!floors.length) return null;
    if (setupFloorId && floors.some((f) => f.id === setupFloorId)) return setupFloorId;
    return floors[0]!.id;
  }, [floors, setupFloorId]);

  const setupFloor = useMemo(
    () => (selectedFloorIdForSetup ? floors.find((f) => f.id === selectedFloorIdForSetup) ?? null : null),
    [floors, selectedFloorIdForSetup],
  );

  const savedRoomRows = useMemo(() => flattenRoomsByFloor(floors), [floors]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    for (const f of floors) {
      const r = f.rooms.find((room) => room.id === selectedRoomId);
      if (r) return r;
    }
    return null;
  }, [floors, selectedRoomId]);

  const selectedRoomFloorId = useMemo(() => {
    if (!selectedRoomId) return null;
    for (const f of floors) {
      if (f.rooms.some((room) => room.id === selectedRoomId)) return f.id;
    }
    return null;
  }, [floors, selectedRoomId]);

  const selectedRoomFloorName = useMemo(() => {
    if (!selectedRoomFloorId) return "";
    return floors.find((f) => f.id === selectedRoomFloorId)?.name ?? "";
  }, [floors, selectedRoomFloorId]);

  const orgName = session.data?.primaryOrganization?.name ?? "Our PG";
  const ownerContact = session.data?.phone?.trim() || session.data?.email?.trim() || "";

  const invalidateProperty = () => {
    void queryClient.invalidateQueries({ queryKey: floorMapQueryKey(orgId) });
    void queryClient.invalidateQueries({ queryKey: ["property-map", orgId] });
    void queryClient.invalidateQueries({ queryKey: ["property-stats", orgId] });
    void queryClient.invalidateQueries({ queryKey: ["property-tenants", orgId] });
  };

  const floorForm = useForm<FloorForm>({
    resolver: zodResolver(createFloorDto),
    defaultValues: { name: "", gridColumns: 12 },
  });

  const bedForm = useForm<AddBedForm>({
    resolver: zodResolver(addBedFormSchema),
    defaultValues: { label: "Bed A", rentRupees: 8000 },
  });

  const createFloorMut = useMutation({
    mutationFn: (body: CreateFloorInput) => createFloorApi(orgId!, body),
    onSuccess: async (floor) => {
      toast.success(`Floor “${floor.name}” added`);
      setSetupFloorId(floor.id);
      floorForm.reset({ name: "", gridColumns: 12 });
      /** Merge new floor into cache so setup floor id matches before refetch completes. */
      queryClient.setQueryData<{ floors: PropertyMapFloor[] }>(floorMapQueryKey(orgId), (prev) => {
        const next: PropertyMapFloor = {
          id: floor.id,
          name: floor.name,
          sortOrder: floor.sortOrder,
          gridColumns: floor.gridColumns,
          rooms: [],
        };
        if (!prev?.floors?.length) return { floors: [next] };
        if (prev.floors.some((f) => f.id === next.id)) return prev;
        return { floors: [...prev.floors, next].sort((a, b) => a.sortOrder - b.sortOrder) };
      });
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFloorMut = useMutation({
    mutationFn: (id: string) => deleteFloorApi(orgId!, id),
    onSuccess: async (_data, deletedId) => {
      toast.success("Floor removed");
      setSelectedRoomId(null);
      setSetupFloorId((prev) => (prev === deletedId ? null : prev));
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveDraftRowsMut = useMutation({
    mutationFn: async ({ floorId, draftRows }: { floorId: string; draftRows: DraftRoomRow[] }) => {
      const map = await fetchFloorMap(orgId!);
      let floor = map.floors.find((f) => f.id === floorId);
      if (!floor) throw new Error("Floor not found. Refresh the page and try again.");

      for (const row of draftRows) {
        const name = row.roomNumber.trim();
        if (!name) continue;
        const beds = Math.min(12, Math.max(1, Math.floor(Number(row.sharingBeds)) || 1));
        const minor = Math.round(Math.max(0, Number(row.rentPerBedRupees) || 0) * 100);
        const placement = nextRoomPlacement(floor);
        const created = (await createRoomApi(orgId!, floorId, {
          ...placement,
          name,
        })) as {
          id: string;
          name: string;
          colStart: number;
          colSpan: number;
          rowStart: number;
          rowSpan: number;
          sortOrder: number;
        };
        await updateRoomApi(orgId!, created.id, { sharingLabel: `${beds} sharing` });
        const letters = "ABCDEFGHIJKL".split("").slice(0, beds);
        for (const label of letters) {
          await createBedApi(orgId!, created.id, { label, monthlyRentMinor: minor });
        }
        floor = {
          ...floor,
          rooms: [
            ...floor.rooms,
            {
              id: created.id,
              name: created.name,
              sharingLabel: `${beds} sharing`,
              colStart: created.colStart,
              colSpan: created.colSpan,
              rowStart: created.rowStart,
              rowSpan: created.rowSpan,
              sortOrder: created.sortOrder,
              aggregateStatus: "VACANT",
              beds: [],
            },
          ],
        };
      }
    },
    onSuccess: async () => {
      toast.success("Rooms saved");
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRoomMut = useMutation({
    mutationFn: (rid: string) => deleteRoomApi(orgId!, rid),
    onSuccess: async () => {
      toast.success("Room removed");
      setSelectedRoomId(null);
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRoomMut = useMutation({
    mutationFn: ({ rid, body }: { rid: string; body: UpdateRoomLayoutInput }) =>
      updateRoomApi(orgId!, rid, body),
    onSuccess: async () => {
      toast.success("Room updated");
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createBedMut = useMutation({
    mutationFn: ({ rid, body }: { rid: string; body: CreateBedInput }) =>
      createBedApi(orgId!, rid, body),
    onSuccess: async () => {
      toast.success("Bed added");
      bedForm.reset({ label: "Bed A", rentRupees: 8000 });
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMut = useMutation({
    mutationFn: ({ bid, tenantUserId }: { bid: string; tenantUserId: string }) =>
      assignBedApi(orgId!, bid, { tenantUserId }),
    onMutate: ({ bid }) => setBusyBedId(bid),
    onSettled: () => setBusyBedId(null),
    onSuccess: async () => {
      toast.success("Tenant assigned");
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const vacateMut = useMutation({
    mutationFn: (bid: string) => vacateBedApi(orgId!, bid),
    onMutate: (bid) => setBusyBedId(bid),
    onSettled: () => setBusyBedId(null),
    onSuccess: async () => {
      toast.success("Bed vacated");
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaidMut = useMutation({
    mutationFn: ({ bid, paidThrough }: { bid: string; paidThrough: string }) =>
      markBedPaidApi(orgId!, bid, { paidThrough }),
    onMutate: ({ bid }) => setBusyBedId(bid),
    onSettled: () => setBusyBedId(null),
    onSuccess: async () => {
      toast.success("Payment recorded");
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const maintMut = useMutation({
    mutationFn: ({ bid, note }: { bid: string; note: string }) =>
      updateBedApi(orgId!, bid, {
        status: "UNDER_MAINTENANCE",
        maintenanceNote: note,
      }),
    onMutate: ({ bid }) => setBusyBedId(bid),
    onSettled: () => setBusyBedId(null),
    onSuccess: async () => {
      toast.success("Marked under maintenance");
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearMaintMut = useMutation({
    mutationFn: (bid: string) =>
      updateBedApi(orgId!, bid, { status: "VACANT", maintenanceNote: null }),
    onMutate: (bid) => setBusyBedId(bid),
    onSettled: () => setBusyBedId(null),
    onSuccess: async () => {
      toast.success("Bed is vacant again");
      await invalidateProperty();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const layoutForm = useForm<UpdateRoomLayoutInput>({
    defaultValues: { floorId: undefined },
  });

  useEffect(() => {
    if (!selectedRoom || !selectedRoomFloorId) return;
    layoutForm.reset({
      name: selectedRoom.name,
      floorId: selectedRoomFloorId,
      sharingLabel: selectedRoom.sharingLabel ?? undefined,
      colStart: selectedRoom.colStart,
      colSpan: selectedRoom.colSpan,
      rowStart: selectedRoom.rowStart,
      rowSpan: selectedRoom.rowSpan,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync draft layout when this room changes on the server
  }, [
    selectedRoomFloorId,
    selectedRoom?.id,
    selectedRoom?.name,
    selectedRoom?.sharingLabel,
    selectedRoom?.colStart,
    selectedRoom?.colSpan,
    selectedRoom?.rowStart,
    selectedRoom?.rowSpan,
  ]);

  const tenantOptions = tenantsQuery.data?.members ?? [];

  return (
    <OwnerShell title="Floor map" contentMaxClassName="max-w-7xl">
      {session.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load your profile.
        </div>
      ) : !orgId ? (
        <p className="text-sm text-slate-600">No organization linked to this account.</p>
      ) : (
        <div className="space-y-8">
          <PropertyStatsBanner stats={statsQuery.data} isLoading={statsQuery.isLoading} />

          <p className="text-base leading-relaxed text-slate-600">
            Your live control centre: colours show rent and vacancy at a glance. Tap a room for tenants, rent, and
            quick actions. Use the register below to add many rooms at once.
          </p>

          {mapQuery.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 p-5 shadow-sm ring-1 ring-red-100">
              <p className="text-sm font-semibold text-red-950">Unable to load floor occupancy</p>
              <p className="mt-2 text-sm text-red-900/90">
                {(mapQuery.error as Error)?.message?.trim() || "Check your connection and try again."}
              </p>
              <Button
                type="button"
                className="mt-4 h-11"
                variant="secondary"
                disabled={mapQuery.isFetching}
                onClick={() => void mapQuery.refetch()}
              >
                {mapQuery.isFetching ? "Retrying…" : "Retry"}
              </Button>
            </div>
          ) : mapQuery.isPending && !mapQuery.data ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
              <p className="text-center text-xs text-slate-500">Loading floor layout…</p>
            </div>
          ) : floors.length > 0 ? (
            <OperationalFloorMap
              floors={floors}
              vacancyFilter={mapVacancyFilter}
              onVacancyFilterChange={setMapVacancyFilter}
              bedStatusFilter={statusFilter}
              onBedStatusFilterChange={setStatusFilter}
              search={search}
              onSearchChange={setSearch}
              onRoomSelect={(room) => setSelectedRoomId(room.id)}
              canDeleteFloors={canStructure}
              onDeleteFloor={(id) => deleteFloorMut.mutate(id)}
              deletingFloorId={deleteFloorMut.isPending ? (deleteFloorMut.variables ?? null) : null}
            />
          ) : null}

          {canStructure ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
              <h2 className="text-base font-semibold text-slate-900">Floors</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add a floor first (Ground, 1st, 2nd…). Then pick where new room rows should go.
              </p>

              <form
                className="mt-5 space-y-4"
                onSubmit={floorForm.handleSubmit((values) => {
                  const name = values.name.trim();
                  if (!name) {
                    toast.error("Enter a floor name");
                    return;
                  }
                  createFloorMut.mutate({ name, gridColumns: 12 });
                })}
              >
                <label className="block text-sm font-medium text-slate-700">
                  New floor name
                  <Input
                    className="mt-2 h-12 text-base"
                    placeholder="e.g. Ground floor"
                    autoComplete="off"
                    disabled={createFloorMut.isPending}
                    {...floorForm.register("name")}
                  />
                </label>
                <Button type="submit" className="h-12 w-full sm:w-auto sm:min-w-[10rem]" disabled={createFloorMut.isPending}>
                  {createFloorMut.isPending ? "Adding floor…" : "Add floor"}
                </Button>
                {floorForm.formState.errors.name ? (
                  <p className="text-sm text-red-600">{floorForm.formState.errors.name.message}</p>
                ) : null}
              </form>

              {floors.length > 0 ? (
                <div className="mt-6 space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Where should new rooms be added?
                    <select
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base"
                      value={selectedFloorIdForSetup ?? ""}
                      onChange={(e) => setSetupFloorId(e.target.value || null)}
                    >
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-600">
                      Remove a floor and <strong>all</strong> its rooms and beds (soft-deleted on the server).
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 shrink-0 text-sm font-semibold text-red-700 hover:bg-red-100/80"
                      disabled={!selectedFloorIdForSetup || deleteFloorMut.isPending}
                      onClick={() => {
                        const f = floors.find((x) => x.id === selectedFloorIdForSetup);
                        if (!f) return;
                        if (
                          window.confirm(
                            `Remove “${f.name}” and all rooms and beds on it? This cannot be undone.`,
                          )
                        ) {
                          deleteFloorMut.mutate(f.id);
                        }
                      }}
                    >
                      {deleteFloorMut.isPending ? "Deleting…" : "Delete selected floor"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-6 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200/80">
                  No floors yet — use <strong>Add floor</strong> above, then your room list will appear.
                </p>
              )}
            </section>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Only owners and managers can add floors or rooms. Ask your PG admin for access.
            </p>
          )}

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">Your rooms</h2>
            <SavedRoomsTable rows={savedRoomRows} onOpenRoom={(id) => setSelectedRoomId(id)} />
          </section>

          {canStructure && selectedFloorIdForSetup ? (
            <RoomDraftSpreadsheet
              floorId={selectedFloorIdForSetup}
              floorLabel={setupFloor?.name ?? "—"}
              disabled={!canStructure}
              isSaving={saveDraftRowsMut.isPending}
              onSave={async (draftRows) => {
                await saveDraftRowsMut.mutateAsync({ floorId: selectedFloorIdForSetup, draftRows });
              }}
            />
          ) : null}

          {floors.length === 0 ? (
            <p className="text-center text-slate-600">Add a floor to start your room list.</p>
          ) : (
            <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/[0.04] [&_summary]:cursor-pointer">
              <summary className="list-none px-4 py-4 text-sm font-semibold text-slate-800 sm:px-5 [&::-webkit-details-marker]:hidden">
                Advanced · drag rooms on coordinate grid
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Optional layout editor — uses the same search and status filters as the map above.
                </span>
              </summary>
              <div className="border-t border-slate-100 px-4 pb-5 pt-3 sm:px-5">
                {canStructure ? (
                  <div className="mb-4">
                    <Button
                      type="button"
                      variant={arrangeMode ? "primary" : "secondary"}
                      className="text-sm"
                      onClick={() => setArrangeMode((v) => !v)}
                    >
                      {arrangeMode ? "Done moving rooms" : "Move rooms on grid"}
                    </Button>
                  </div>
                ) : null}
                <div className="space-y-8">
                  {floors.map((f) => (
                    <div key={f.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{f.name}</h3>
                          <p className="text-xs text-slate-500">
                            {f.rooms.length} room{f.rooms.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        {canStructure ? (
                          <button
                            type="button"
                            className="text-sm font-medium text-red-700 hover:underline"
                            onClick={() => {
                              if (window.confirm(`Remove “${f.name}” and all rooms on it?`)) {
                                deleteFloorMut.mutate(f.id);
                              }
                            }}
                          >
                            Remove floor
                          </button>
                        ) : null}
                      </div>
                      <FloorMapGrid
                        floor={f}
                        statusFilter={statusFilter}
                        search={search}
                        arrangeMode={arrangeMode && Boolean(canStructure)}
                        dragRoomRef={dragRoomRef}
                        onRoomSelect={(room) => {
                          if (!arrangeMode) setSelectedRoomId(room.id);
                        }}
                        onDropReposition={(room, colStart, rowStart) => {
                          if (!canStructure || !orgId) return;
                          updateRoomMut.mutate({
                            rid: room.id,
                            body: { colStart, rowStart, colSpan: room.colSpan, rowSpan: room.rowSpan },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}

          {selectedRoom ? (
            <div
              className="fixed inset-0 z-40 flex justify-end bg-black/30 p-2 sm:p-4"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) dismissRoomPanel();
              }}
            >
              <aside
                className="flex h-full w-full max-w-md flex-col overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-black/10"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{selectedRoom.name}</h2>
                    <p className="text-xs text-slate-500">
                      {selectedRoom.beds.length} space{selectedRoom.beds.length === 1 ? "" : "s"} · assign people &
                      record rent below
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                    onClick={() => dismissRoomPanel()}
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 space-y-4 px-4 py-4">
                  <div className="rounded-xl border border-[#1a4d32]/15 bg-emerald-50/40 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1a4d32]/90">Quick actions</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 border-[#1a4d32]/25 bg-white text-xs font-semibold text-[#1a4d32] hover:bg-emerald-50"
                        onClick={() => {
                          void (async () => {
                            try {
                              const text = buildVacancyShareText({
                                orgName,
                                floorName: selectedRoomFloorName || "Floor",
                                room: selectedRoom,
                                contact: ownerContact,
                              });
                              await navigator.clipboard.writeText(text);
                              toast.success("Copied — paste in WhatsApp");
                            } catch {
                              toast.error("Could not copy");
                            }
                          })();
                        }}
                      >
                        Share vacancy
                      </Button>
                      <NavLink
                        to={ROUTES.ownerRent}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Rent
                      </NavLink>
                      <NavLink
                        to={ROUTES.ownerMaintenance}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Maintenance
                      </NavLink>
                      <NavLink
                        to={ROUTES.ownerTenants}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Tenants
                      </NavLink>
                    </div>
                  </div>

                  {canStructure ? (
                    <form
                      className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                      onSubmit={layoutForm.handleSubmit((body) =>
                        updateRoomMut.mutate({ rid: selectedRoom.id, body }),
                      )}
                    >
                      <p className="text-xs font-semibold uppercase text-slate-500">Room details</p>
                      <div className="grid grid-cols-1 gap-3">
                        <label className="text-xs font-medium text-slate-600">
                          Which floor?
                          <select
                            className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-2 text-base"
                            {...layoutForm.register("floorId")}
                          >
                            {floors.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Room name / number
                          <Input className="mt-1 h-11 text-base" {...layoutForm.register("name")} />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Note on room type <span className="font-normal text-slate-400">(optional)</span>
                          <Input
                            className="mt-1 h-11 text-base"
                            placeholder="e.g. AC · 3-sharing"
                            {...layoutForm.register("sharingLabel")}
                          />
                        </label>
                      </div>
                      <details className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 [&_summary]:cursor-pointer">
                        <summary className="font-medium text-slate-800">Map position (advanced)</summary>
                        <p className="mt-2 text-[11px] text-slate-500">
                          Only needed if you use “Move rooms on map”. Most owners never open this.
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <label className="text-xs text-slate-600">
                            Column start
                            <Input
                              type="number"
                              className="mt-1"
                              {...layoutForm.register("colStart", { valueAsNumber: true })}
                            />
                          </label>
                          <label className="text-xs text-slate-600">
                            Column width
                            <Input
                              type="number"
                              className="mt-1"
                              {...layoutForm.register("colSpan", { valueAsNumber: true })}
                            />
                          </label>
                          <label className="text-xs text-slate-600">
                            Row start
                            <Input
                              type="number"
                              className="mt-1"
                              {...layoutForm.register("rowStart", { valueAsNumber: true })}
                            />
                          </label>
                          <label className="text-xs text-slate-600">
                            Row height
                            <Input
                              type="number"
                              className="mt-1"
                              {...layoutForm.register("rowSpan", { valueAsNumber: true })}
                            />
                          </label>
                        </div>
                      </details>
                      <Button type="submit" variant="secondary" className="w-full sm:w-auto" disabled={updateRoomMut.isPending}>
                        Save room changes
                      </Button>
                    </form>
                  ) : null}

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900">Who is here & rent</h3>
                    {selectedRoom.beds.map((bed) => (
                      <BedCard
                        key={bed.id}
                        bed={bed}
                        tenantOptions={tenantOptions}
                        busyBedId={busyBedId}
                        canMutateBeds
                        onAssign={(bid, tenantUserId) => assignMut.mutate({ bid, tenantUserId })}
                        onVacate={(bid) => vacateMut.mutate(bid)}
                        onMarkPaid={(bid, iso) => markPaidMut.mutate({ bid, paidThrough: iso })}
                        onSetMaintenance={(bid, note) => maintMut.mutate({ bid, note })}
                        onClearMaintenance={(bid) => clearMaintMut.mutate(bid)}
                      />
                    ))}
                  </div>

                  {canStructure ? (
                    <form
                      className="border-t border-slate-100 pt-4"
                      onSubmit={bedForm.handleSubmit(({ label, rentRupees }) =>
                        createBedMut.mutate({
                          rid: selectedRoom.id,
                          body: { label, monthlyRentMinor: Math.round(rentRupees * 100) },
                        }),
                      )}
                    >
                      <p className="text-xs font-semibold text-slate-700">Add another space (rare)</p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <label className="flex-1 text-xs font-medium text-slate-600">
                          Bed name
                          <Input className="mt-1 h-11 text-base" placeholder="e.g. D" {...bedForm.register("label")} />
                        </label>
                        <label className="w-full text-xs font-medium text-slate-600 sm:w-36">
                          Rent (₹ / month)
                          <Input
                            type="number"
                            min={0}
                            step={100}
                            className="mt-1 h-11 text-base"
                            {...bedForm.register("rentRupees", { valueAsNumber: true })}
                          />
                        </label>
                        <Button type="submit" className="h-11 w-full shrink-0 sm:w-auto" disabled={createBedMut.isPending}>
                          Add bed
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  {canStructure ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-red-700 hover:bg-red-50"
                      disabled={deleteRoomMut.isPending}
                      onClick={() => {
                        if (window.confirm("Delete this room and all beds?")) {
                          deleteRoomMut.mutate(selectedRoom.id);
                        }
                      }}
                    >
                      Delete room
                    </Button>
                  ) : null}
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      )}
    </OwnerShell>
  );
}
