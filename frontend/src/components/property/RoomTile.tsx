import { getBedVisualTone } from "../../lib/bed-visual";
import type { BedStatus, PropertyMapRoom } from "../../types/property";
import { roomStatusChrome } from "./bed-status-styles";
import { operationalBedChipClass } from "./operational-map-styles";

type Props = {
  room: PropertyMapRoom;
  onSelect: (room: PropertyMapRoom) => void;
  /** When filter hides this room — still in DOM for layout, visually muted */
  muted?: boolean;
  /** Optional: enable native drag to signal layout tools (drop handled by parent) */
  draggable?: boolean;
  onDragStartRoom?: (room: PropertyMapRoom, ev: React.DragEvent) => void;
  onDragEndRoom?: () => void;
};

export function RoomTile({
  room,
  onSelect,
  muted,
  draggable,
  onDragStartRoom,
  onDragEndRoom,
}: Props) {
  const status: BedStatus = room.aggregateStatus;
  const occupied = room.beds.filter(
    (b) => b.status === "OCCUPIED_PAID" || b.status === "OCCUPIED_UNPAID",
  ).length;
  const bedsSorted = [...room.beds].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  return (
    <button
      type="button"
      draggable={Boolean(draggable)}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", room.id);
        onDragStartRoom?.(room, e);
      }}
      onDragEnd={() => onDragEndRoom?.()}
      onClick={() => onSelect(room)}
      style={{
        gridColumn: `${room.colStart} / span ${room.colSpan}`,
        gridRow: `${room.rowStart} / span ${room.rowSpan}`,
      }}
      className={[
        "group flex min-h-[4.5rem] flex-col rounded-xl border-2 p-2 text-left transition",
        "hover:z-10 hover:ring-2 hover:ring-slate-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900",
        roomStatusChrome(status),
        muted ? "opacity-40 saturate-50" : "opacity-100",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="line-clamp-2 text-xs font-semibold leading-tight text-slate-900 md:text-sm">
            {room.name}
          </div>
          {room.sharingLabel ? (
            <div className="mt-0.5 text-[10px] font-normal text-slate-500">{room.sharingLabel}</div>
          ) : null}
        </div>
        <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200">
          {room.beds.length} bed{room.beds.length === 1 ? "" : "s"}
        </span>
      </div>
      {bedsSorted.length ? (
        <div className="mt-2 flex flex-wrap gap-1" aria-label="Beds on this room">
          {bedsSorted.map((b) => (
            <span
              key={b.id}
              title={`${b.label}: ${b.status.replace(/_/g, " ").toLowerCase()}`}
              className={[
                "flex h-6 min-w-[1.35rem] items-center justify-center rounded-md text-[10px] font-bold tabular-nums",
                operationalBedChipClass(getBedVisualTone(b)),
              ].join(" ")}
            >
              {b.label.replace(/^Bed\s+/i, "").slice(0, 3)}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-auto flex items-center justify-between text-[10px] text-slate-600 md:text-xs">
        <span>
          {occupied}/{room.beds.length} filled
        </span>
        <span className="opacity-0 transition group-hover:opacity-100">Open →</span>
      </div>
    </button>
  );
}
