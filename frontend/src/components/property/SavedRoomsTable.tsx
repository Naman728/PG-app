import {
  formatRupees,
  humanRoomStatus,
  rentPerSpaceMinor,
  type SavedRoomRow,
  sharingTypeLabel,
  totalRoomRentMinor,
} from "../../lib/room-display";

type Props = {
  rows: SavedRoomRow[];
  onOpenRoom: (roomId: string) => void;
};

export function SavedRoomsTable({ rows, onOpenRoom }: Props) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-600">
        No rooms yet. Use <strong>Add rooms</strong> below, or the range tool.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="px-3 py-3 sm:px-4">Floor</th>
            <th className="px-3 py-3 sm:px-4">Room</th>
            <th className="px-3 py-3 sm:px-4">Sharing</th>
            <th className="px-3 py-3 sm:px-4">Rent each</th>
            <th className="px-3 py-3 sm:px-4">Total room</th>
            <th className="px-3 py-3 sm:px-4">Status</th>
            <th className="px-3 py-3 sm:px-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ floorName, room }) => {
            const per = rentPerSpaceMinor(room);
            const total = totalRoomRentMinor(room);
            return (
              <tr key={room.id} className="border-b border-slate-100 text-sm last:border-0">
                <td className="px-3 py-3 text-slate-700 sm:px-4">{floorName}</td>
                <td className="px-3 py-3 text-base font-semibold text-slate-900 sm:px-4">{room.name}</td>
                <td className="px-3 py-3 text-slate-700 sm:px-4">{sharingTypeLabel(room)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-800 sm:px-4">{formatRupees(per)}</td>
                <td className="px-3 py-3 text-base font-semibold tabular-nums text-slate-900 sm:px-4">
                  {formatRupees(total)}
                </td>
                <td className="px-3 py-3 text-slate-700 sm:px-4">{humanRoomStatus(room)}</td>
                <td className="px-3 py-3 sm:px-4">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    onClick={() => onOpenRoom(room.id)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
