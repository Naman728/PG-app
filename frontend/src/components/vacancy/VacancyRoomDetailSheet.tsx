import { toast } from "sonner";
import { Button } from "../ui/button";
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
import { buildVacancyShareText } from "../../lib/share-vacancy";
import { getVacancyPresentation, vacancyStripeClasses } from "../../lib/vacancy-visual";
import type { PropertyMapBed } from "../../types/property";
import type { VacancyRow } from "./VacancyOpsRoomCard";

type Props = {
  row: VacancyRow;
  orgName: string;
  contact: string;
  onClose: () => void;
  onShare: () => void;
  onViewMap: () => void;
  onAssign: () => void;
  onMarkMaintenance: () => void;
  maintenanceBusy: boolean;
};

export function VacancyRoomDetailSheet({
  row,
  orgName,
  contact,
  onClose,
  onShare,
  onViewMap,
  onAssign,
  onMarkMaintenance,
  maintenanceBusy,
}: Props) {
  const { floor, room } = row;
  const vac = vacantBedCount(room);
  const total = room.beds.length;
  const presentation = getVacancyPresentation(room);
  const stripe = vacancyStripeClasses(presentation.stripe);
  const vacantBeds = room.beds.filter((b: PropertyMapBed) => b.status === "VACANT");
  const oldestHint = vacantBeds
    .map((b: PropertyMapBed) => daysSinceVacantHint(b))
    .filter((d: number | null): d is number => d != null);
  const daysVacant = oldestHint.length ? Math.max(...oldestHint) : null;
  const overduePartial = vacancyRoomHasOverdueOccupied(room) && vac > 0 && vac < total;

  async function copyCard() {
    const text = buildVacancyShareText({
      orgName,
      floorName: floor.name,
      room,
      contact,
    });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10080] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vac-detail-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[88dvh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden />
        <div className="flex max-h-[88dvh] flex-col">
          <div className="relative shrink-0 border-b border-slate-100 px-4 py-4 pl-5 sm:px-6">
            <div className={`absolute bottom-0 left-0 top-0 w-1.5 ${stripe.bar}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-slate-500">{floor.name}</p>
                <h2 id="vac-detail-title" className="text-2xl font-bold tracking-tight text-slate-950">
                  {room.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-600">{sharingTypeLabel(room)}</p>
              </div>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={onClose}
              >
                Close
              </button>
            </div>
            <span
              className={[
                "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset",
                stripe.chip,
              ].join(" ")}
            >
              {presentation.headline}
            </span>
            <p className="mt-2 text-sm text-slate-600">{presentation.subline}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6">
            {overduePartial ? (
              <div className="mb-4 rounded-xl bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-950 ring-1 ring-rose-200">
                Overdue rent on occupied beds — collect dues while you fill empty beds.
              </div>
            ) : null}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
                <dt className="text-[10px] font-bold uppercase text-slate-500">Vacant beds</dt>
                <dd className="mt-1 text-lg font-bold tabular-nums">{vac}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
                <dt className="text-[10px] font-bold uppercase text-slate-500">Total beds</dt>
                <dd className="mt-1 text-lg font-bold tabular-nums">{total}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
                <dt className="text-[10px] font-bold uppercase text-slate-500">Rent / bed</dt>
                <dd className="mt-1 font-bold tabular-nums">{formatRupees(rentPerSpaceMinor(room))}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
                <dt className="text-[10px] font-bold uppercase text-slate-500">Days vacant (est.)</dt>
                <dd className="mt-1 font-bold tabular-nums">{daysVacant != null ? `${daysVacant}d` : "—"}</dd>
              </div>
              <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
                <dt className="text-[10px] font-bold uppercase text-slate-500">Move-in</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {readyForMoveIn(room) ? "Ready to move in" : "Verify beds before promising dates"}
                </dd>
              </div>
              <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/80">
                <dt className="text-[10px] font-bold uppercase text-slate-500">Amenities note</dt>
                <dd className="mt-1 font-medium text-slate-800">{amenitiesHint(room)}</dd>
              </div>
            </dl>
          </div>

          <div className="shrink-0 space-y-2 border-t border-slate-100 bg-slate-50/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" className="h-12 font-semibold" onClick={onShare}>
                Share
              </Button>
              <Button type="button" variant="secondary" className="h-12 font-semibold" onClick={() => void copyCard()}>
                Copy
              </Button>
              <Button type="button" variant="secondary" className="h-12 font-semibold" onClick={onViewMap}>
                Floor map
              </Button>
              <Button type="button" variant="secondary" className="h-12 font-semibold" onClick={onAssign}>
                Assign
              </Button>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full font-semibold"
              disabled={maintenanceBusy}
              onClick={onMarkMaintenance}
            >
              {maintenanceBusy ? "Updating…" : "Mark vacant beds under maintenance"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
