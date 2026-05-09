import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  amenitiesHint,
  formatRupees,
  readyForMoveIn,
  rentPerSpaceMinor,
  sharingTypeLabel,
  vacantBedCount,
} from "../../lib/room-display";
import { buildVacancyShareText, vacancyWhatsAppShareUrl } from "../../lib/share-vacancy";
import type { VacancyRow } from "./VacancyOpsRoomCard";

type Props = {
  row: VacancyRow;
  orgName: string;
  contact: string;
  onClose: () => void;
};

export function VacancyShareSheet({ row, orgName, contact, onClose }: Props) {
  const { floor, room } = row;
  const vac = vacantBedCount(room);
  const rent = rentPerSpaceMinor(room);
  const share = sharingTypeLabel(room);
  const amen = amenitiesHint(room);
  const ready = readyForMoveIn(room);

  const message = buildVacancyShareText({
    orgName,
    floorName: floor.name,
    room,
    contact,
  });

  const waUrl = vacancyWhatsAppShareUrl(message);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Copied — paste anywhere");
    } catch {
      toast.error("Could not copy");
    }
  }, [message]);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: `${orgName} · ${room.name}`, text: message });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      await copy();
    }
  }, [copy, message, orgName, room.name]);

  return (
    <div
      className="fixed inset-0 z-[10080] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vac-share-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden />

        <div className="max-h-[92dvh] overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-6 sm:pt-5">
          <h2 id="vac-share-title" className="text-lg font-bold text-slate-950">
            Share vacancy
          </h2>
          <p className="mt-1 text-sm text-slate-600">Clean card for WhatsApp or walk-in students.</p>

          <div className="mt-5 overflow-hidden rounded-2xl border-2 border-[#0f6e56]/25 bg-gradient-to-b from-emerald-50/80 to-white shadow-inner ring-1 ring-emerald-900/10">
            <div className="border-b border-emerald-900/10 bg-[#0f6e56] px-4 py-3 text-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100/90">{orgName}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{room.name}</p>
              <p className="mt-0.5 text-sm font-medium text-emerald-50/95">{share}</p>
            </div>
            <div className="grid gap-3 px-4 py-4">
              <div className="flex items-baseline justify-between gap-3 rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200/80">
                <span className="text-xs font-semibold uppercase text-slate-500">Rent / bed</span>
                <span className="text-lg font-bold tabular-nums text-slate-950">{formatRupees(rent)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200/80">
                <span className="text-xs font-semibold uppercase text-slate-500">Beds free</span>
                <span className="text-lg font-bold tabular-nums text-emerald-800">{vac}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200/80">
                <span className="text-xs font-semibold uppercase text-slate-500">Floor</span>
                <span className="text-sm font-semibold text-slate-900">{floor.name}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 rounded-xl bg-white/90 px-3 py-2 ring-1 ring-slate-200/80">
                <span className="text-xs font-semibold uppercase text-slate-500">Amenities</span>
                <span className="text-right text-sm font-medium text-slate-800">{amen}</span>
              </div>
              <div className="rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-bold text-white">
                {ready ? "Ready to move in" : "Confirm availability before committing"}
              </div>
              {contact ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Contact</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{contact}</p>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-500">Add phone or email to your profile for contact on shares.</p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="h-12 flex-1 text-base font-semibold" onClick={() => void copy()}>
              Copy text
            </Button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-[#25D366] text-base font-semibold text-white hover:bg-[#1ebe5b]"
            >
              WhatsApp
            </a>
          </div>
          {typeof navigator !== "undefined" && "share" in navigator && typeof navigator.share === "function" ? (
            <Button type="button" variant="secondary" className="mt-2 h-12 w-full font-semibold" onClick={() => void nativeShare()}>
              Share via…
            </Button>
          ) : null}
          <Button type="button" variant="secondary" className="mt-2 h-12 w-full font-semibold" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
