import { memo, useMemo } from "react";
import type { PropertyMapBed, PropertyMapFloor, PropertyMapRoom } from "../../types/property";
import {
  amenitiesHint,
  daysSinceVacantHint,
  formatRupees,
  readyForMoveIn,
  rentPerSpaceMinor,
  sharingTypeLabel,
  vacantBedCount,
  vacancyRoomHasOverdueOccupied,
} from "../../lib/room-display";
import { getVacancyPresentation, vacancyStripeClasses } from "../../lib/vacancy-visual";

export type VacancyRow = { floor: PropertyMapFloor; room: PropertyMapRoom };

type Props = {
  row: VacancyRow;
  onShare: () => void;
  onOpenDetail: () => void;
  onViewMap: () => void;
  onAssign: () => void;
  onMarkMaintenance: () => void;
  maintenanceBusy: boolean;
};

function IconShare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v12M8 7l4-4 4 4M5 15h14v4H5v-4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7.5l6-3 8 4v13l-6-3-8 4V7.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUserPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M13 7a4 4 0 11-8 0 4 4 0 018 0zM20 8v6M23 11h-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.35 6.35a2 2 0 01-2.83-2.83l6.35-6.35a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VacancyOpsRoomCardInner({
  row,
  onShare,
  onOpenDetail,
  onViewMap,
  onAssign,
  onMarkMaintenance,
  maintenanceBusy,
}: Props) {
  const { floor, room } = row;
  const vac = vacantBedCount(room);
  const total = room.beds.length;
  const filled = total - vac;
  const presentation = useMemo(() => getVacancyPresentation(room), [room]);
  const stripe = vacancyStripeClasses(presentation.stripe);

  const vacantBeds = useMemo(
    () => room.beds.filter((b: PropertyMapBed) => b.status === "VACANT"),
    [room.beds],
  );
  const oldestHint = vacantBeds
    .map((b: PropertyMapBed) => daysSinceVacantHint(b))
    .filter((d: number | null): d is number => d != null);
  const daysVacant = oldestHint.length ? Math.max(...oldestHint) : null;

  const rent = rentPerSpaceMinor(room);
  const shareLabel = sharingTypeLabel(room);
  const overduePartial = vacancyRoomHasOverdueOccupied(room) && vac > 0 && vac < total;

  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl border-2 bg-white shadow-md ring-2 transition",
        stripe.halo,
        "border-slate-200/90 active:scale-[0.995]",
      ].join(" ")}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 ${stripe.bar}`} aria-hidden />
      <button
        type="button"
        onClick={onOpenDetail}
        className="flex w-full flex-col gap-3 px-4 pb-3 pt-3.5 pl-5 text-left sm:px-5 sm:pb-4 sm:pt-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{floor.name}</p>
            <p className="truncate text-xl font-bold tracking-tight text-slate-950">{room.name}</p>
            <p className="mt-0.5 text-sm font-medium text-slate-600">{shareLabel}</p>
          </div>
          <span
            className={[
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
              stripe.chip,
            ].join(" ")}
          >
            {presentation.headline}
          </span>
        </div>

        <p className="text-xs font-medium leading-snug text-slate-600">{presentation.subline}</p>

        {overduePartial ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900 ring-1 ring-rose-200">
            Some filled beds are overdue — prioritize rent while you fill empty slots.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
            <p className="text-[10px] font-bold uppercase text-slate-500">Free</p>
            <p className="text-lg font-bold tabular-nums text-slate-950">
              {vac}
              <span className="text-xs font-semibold text-slate-500"> / {total}</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
            <p className="text-[10px] font-bold uppercase text-slate-500">Rent / bed</p>
            <p className="text-base font-bold tabular-nums text-slate-950">{formatRupees(rent)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
            <p className="text-[10px] font-bold uppercase text-slate-500">Filled</p>
            <p className="text-base font-bold tabular-nums text-slate-950">{filled}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
            <p className="text-[10px] font-bold uppercase text-slate-500">Vacant ~</p>
            <p className="text-base font-bold tabular-nums text-slate-950">{daysVacant != null ? `${daysVacant}d` : "—"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              readyForMoveIn(room) ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            {readyForMoveIn(room) ? "Ready to move in" : "Check before showing"}
          </span>
          <span className="text-slate-400">·</span>
          <span>{amenitiesHint(room)}</span>
        </div>
      </button>

      <div className="grid grid-cols-4 gap-1 border-t border-slate-200 bg-slate-50/90 px-1 py-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold text-slate-800 hover:bg-white"
        >
          <IconShare />
          Share
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewMap();
          }}
          className="flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold text-slate-800 hover:bg-white"
        >
          <IconMap />
          Map
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAssign();
          }}
          className="flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold text-slate-800 hover:bg-white"
        >
          <IconUserPlus />
          Assign
        </button>
        <button
          type="button"
          disabled={maintenanceBusy}
          onClick={(e) => {
            e.stopPropagation();
            onMarkMaintenance();
          }}
          className="flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold text-slate-800 hover:bg-white disabled:opacity-50"
        >
          <IconWrench />
          {maintenanceBusy ? "…" : "Fix"}
        </button>
      </div>
    </article>
  );
}

export const VacancyOpsRoomCard = memo(VacancyOpsRoomCardInner);
