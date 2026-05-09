import { memo, useMemo } from "react";
import { getBedVisualTone, worstToneInRoom } from "../../lib/bed-visual";
import { vacantBedCount } from "../../lib/room-display";
import type { PropertyMapRoom } from "../../types/property";
import { operationalBedChipClass, operationalRoomFrameClass } from "./operational-map-styles";

type Props = {
  room: PropertyMapRoom;
  onSelect: (room: PropertyMapRoom) => void;
  dimmed: boolean;
};

function bedLetter(label: string): string {
  const s = label.replace(/^Bed\s+/i, "").trim();
  return s.slice(0, 3).toUpperCase();
}

function OperationalRoomCardInner({ room, onSelect, dimmed }: Props) {
  const bedsSorted = useMemo(
    () => [...room.beds].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [room.beds],
  );
  const worst = useMemo(() => worstToneInRoom(room), [room]);
  const vac = vacantBedCount(room);
  const hasVacancy = vac > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      className={[
        "group flex min-h-[5.5rem] flex-col rounded-xl border-2 p-2.5 text-left transition will-change-transform",
        "hover:z-[1] hover:brightness-[1.02] active:scale-[0.99]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a4d32]",
        operationalRoomFrameClass(worst, hasVacancy, dimmed),
      ].join(" ")}
    >
      <div className="rounded-lg bg-slate-100/90 px-2 py-1.5 ring-1 ring-slate-200/80">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Room</p>
        <p className="truncate text-base font-bold leading-tight text-slate-900">{room.name}</p>
        {room.sharingLabel ? (
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-600">{room.sharingLabel}</p>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Beds">
        {bedsSorted.map((b) => {
          const tone = getBedVisualTone(b);
          return (
            <span
              key={b.id}
              title={`${b.label}: ${tone}`}
              className={[
                "flex h-8 min-w-[2rem] items-center justify-center rounded-md text-xs font-bold tabular-nums",
                operationalBedChipClass(tone),
              ].join(" ")}
            >
              {bedLetter(b.label)}
            </span>
          );
        })}
      </div>
      <div className="mt-auto flex items-center justify-between pt-1 text-[10px] font-medium text-slate-600">
        <span>
          {room.beds.length - vac}/{room.beds.length} filled
        </span>
        <span className="text-[#1a4d32] opacity-0 transition group-hover:opacity-100">Open</span>
      </div>
    </button>
  );
}

export const OperationalRoomCard = memo(OperationalRoomCardInner);
