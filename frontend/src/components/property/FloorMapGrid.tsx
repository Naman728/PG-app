import type { BedStatus, PropertyMapFloor, PropertyMapRoom } from "../../types/property";
import { RoomTile } from "./RoomTile";

type Props = {
  floor: PropertyMapFloor;
  statusFilter: BedStatus | "ALL";
  search: string;
  onRoomSelect: (room: PropertyMapRoom) => void;
  arrangeMode: boolean;
  dragRoomRef: React.MutableRefObject<PropertyMapRoom | null>;
  onDropReposition: (room: PropertyMapRoom, colStart: number, rowStart: number) => void;
};

function roomMatches(room: PropertyMapRoom, statusFilter: BedStatus | "ALL", search: string) {
  if (statusFilter !== "ALL" && room.aggregateStatus !== statusFilter) return false;
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

function rowCapacity(floor: PropertyMapFloor) {
  let m = 1;
  for (const r of floor.rooms) {
    m = Math.max(m, r.rowStart + r.rowSpan - 1);
  }
  return Math.max(m, 6);
}

export function FloorMapGrid({
  floor,
  statusFilter,
  search,
  onRoomSelect,
  arrangeMode,
  dragRoomRef,
  onDropReposition,
}: Props) {
  const rowCap = rowCapacity(floor);

  return (
    <div className="space-y-2">
      {arrangeMode ? (
        <p className="text-xs font-medium text-violet-800">
          Drag a room card to a new spot on this floor&apos;s map.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/80 p-2 shadow-inner">
        <div
          onDragOver={(e) => {
            if (!arrangeMode) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            if (!arrangeMode) return;
            e.preventDefault();
            const room = dragRoomRef.current;
            if (!room) return;
            const surface = e.currentTarget;
            if (!(surface instanceof HTMLElement)) return;
            const rect = surface.getBoundingClientRect();
            const relX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
            const relY = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
            const colSpan = room.colSpan;
            const rowSpan = room.rowSpan;
            const maxCol = Math.max(1, floor.gridColumns - colSpan + 1);
            const maxRow = Math.max(1, rowCap - rowSpan + 1);
            const colStart = Math.min(
              maxCol,
              Math.max(1, Math.floor((relX / rect.width) * floor.gridColumns) + 1),
            );
            const rowStart = Math.min(
              maxRow,
              Math.max(1, Math.floor((relY / rect.height) * rowCap) + 1),
            );
            dragRoomRef.current = null;
            if (colStart !== room.colStart || rowStart !== room.rowStart) {
              onDropReposition(room, colStart, rowStart);
            }
          }}
          className="min-w-[320px] gap-2 p-1"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${floor.gridColumns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rowCap}, minmax(52px, auto))`,
          }}
        >
          {floor.rooms.map((room) => (
            <RoomTile
              key={room.id}
              room={room}
              muted={!roomMatches(room, statusFilter, search)}
              draggable={arrangeMode}
              onDragStartRoom={(r) => {
                dragRoomRef.current = r;
              }}
              onDragEndRoom={() => {
                window.setTimeout(() => {
                  dragRoomRef.current = null;
                }, 0);
              }}
              onSelect={onRoomSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
