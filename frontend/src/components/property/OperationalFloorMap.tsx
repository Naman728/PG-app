import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { Input } from "../ui/input";
import {
  occupiedBedCount,
  type MapVacancyFilter,
  roomMatchesMapVacancyFilter,
} from "../../lib/bed-visual";
import { vacantBedCount } from "../../lib/room-display";
import type { BedStatus, PropertyMapFloor, PropertyMapRoom } from "../../types/property";
import { BED_STATUS_SHORT } from "./bed-status-styles";
import { OperationalRoomCard } from "./OperationalRoomCard";
import { OPERATIONAL_LEGEND, operationalBedChipClass } from "./operational-map-styles";

type Props = {
  floors: PropertyMapFloor[];
  vacancyFilter: MapVacancyFilter;
  onVacancyFilterChange: (f: MapVacancyFilter) => void;
  bedStatusFilter: BedStatus | "ALL";
  onBedStatusFilterChange: (s: BedStatus | "ALL") => void;
  search: string;
  onSearchChange: (s: string) => void;
  onRoomSelect: (room: PropertyMapRoom) => void;
};

function roomSearchMatch(room: PropertyMapRoom, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  if (room.name.toLowerCase().includes(q)) return true;
  return room.beds.some(
    (b) =>
      b.label.toLowerCase().includes(q) ||
      (b.tenant?.name?.toLowerCase().includes(q) ?? false) ||
      (b.tenant?.phone?.includes(q) ?? false) ||
      (b.tenant?.email?.toLowerCase().includes(q) ?? false),
  );
}

function roomVisible(
  room: PropertyMapRoom,
  vacancyF: MapVacancyFilter,
  statusF: BedStatus | "ALL",
  search: string,
): boolean {
  if (!roomMatchesMapVacancyFilter(room, vacancyF)) return false;
  if (statusF !== "ALL" && room.aggregateStatus !== statusF) return false;
  return roomSearchMatch(room, search);
}

function sortRooms(rooms: PropertyMapRoom[]): PropertyMapRoom[] {
  return [...rooms].sort((a, b) => {
    const o = a.sortOrder - b.sortOrder;
    if (o !== 0) return o;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

const VACANCY_TABS: { key: MapVacancyFilter; label: string }[] = [
  { key: "all", label: "All rooms" },
  { key: "vacancies_only", label: "Only vacancies" },
  { key: "fully_vacant", label: "Fully empty" },
  { key: "partial", label: "Partly filled" },
];

export function OperationalFloorMap({
  floors,
  vacancyFilter,
  onVacancyFilterChange,
  bedStatusFilter,
  onBedStatusFilterChange,
  search,
  onSearchChange,
  onRoomSelect,
}: Props) {
  const totals = useMemo(() => {
    let beds = 0;
    let vac = 0;
    let occ = 0;
    let rooms = 0;
    for (const f of floors) {
      rooms += f.rooms.length;
      for (const r of f.rooms) {
        beds += r.beds.length;
        vac += vacantBedCount(r);
        occ += occupiedBedCount(r);
      }
    }
    return { rooms, beds, vac, occ, pct: beds ? Math.round((occ / beds) * 100) : 0 };
  }, [floors]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.04] sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status key</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {OPERATIONAL_LEGEND.map(({ tone, label }) => (
            <div key={tone} className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${operationalBedChipClass(tone)}`}>
                ·
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="sticky top-0 z-30 -mx-4 border-b border-slate-200/90 bg-[#f4f6f5]/95 px-4 py-3 shadow-sm backdrop-blur-md md:static md:mx-0 md:rounded-2xl md:border md:border-slate-200/90 md:bg-white md:shadow-sm md:backdrop-blur-none">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vacancy pulse</p>
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {totals.vac}{" "}
              <span className="text-base font-semibold text-slate-600">
                free bed{totals.vac === 1 ? "" : "s"} · {totals.pct}% occupied
              </span>
            </p>
            <p className="text-xs text-slate-500">
              {totals.rooms} rooms · {totals.beds} beds total
            </p>
          </div>
          <NavLink
            to={ROUTES.ownerVacancy}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-[#1a4d32] bg-[#1a4d32] px-4 text-sm font-semibold text-white hover:bg-[#143d28]"
          >
            Vacancy board →
          </NavLink>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {VACANCY_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onVacancyFilterChange(key)}
              className={[
                "min-h-10 rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm",
                vacancyFilter === key
                  ? "border-[#1a4d32] bg-[#1a4d32] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-medium text-slate-700">
            Search rooms & tenants
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Room no. or name…"
              className="mt-1 h-11 rounded-xl border-slate-200 text-base"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "OCCUPIED_PAID", "OCCUPIED_UNPAID", "VACANT", "UNDER_MAINTENANCE"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onBedStatusFilterChange(key)}
                className={[
                  "min-h-9 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold sm:text-xs",
                  bedStatusFilter === key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {key === "ALL" ? "All statuses" : BED_STATUS_SHORT[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {floors.map((floor) => {
        const visible = sortRooms(floor.rooms).filter((r) => roomVisible(r, vacancyFilter, bedStatusFilter, search));
        const fBeds = floor.rooms.reduce((s, r) => s + r.beds.length, 0);
        const fVac = floor.rooms.reduce((s, r) => s + vacantBedCount(r), 0);
        const fOcc = floor.rooms.reduce((s, r) => s + occupiedBedCount(r), 0);
        const fPct = fBeds ? Math.round((fOcc / fBeds) * 100) : 0;

        return (
          <section
            key={floor.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.04] sm:p-6 [content-visibility:auto] [contain-intrinsic-size:1px_480px]"
          >
            <header className="mb-4 flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{floor.name}</h2>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {floor.rooms.length} ROOM{floor.rooms.length === 1 ? "" : "S"} · {fBeds} BED{fBeds === 1 ? "" : "S"}
                </p>
                <p className="text-xs text-slate-500">
                  {fOcc} filled · {fVac} vacant · {fPct}% occupancy
                </p>
              </div>
            </header>

            {!visible.length ? (
              <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-600 ring-1 ring-slate-200/80">
                No rooms match these filters on this floor.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visible.map((room) => (
                  <OperationalRoomCard key={room.id} room={room} onSelect={onRoomSelect} dimmed={false} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
