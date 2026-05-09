import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export type DraftRoomRow = {
  clientId: string;
  roomNumber: string;
  sharingBeds: number;
  rentPerBedRupees: number;
};

const SHARING_OPTIONS = [
  { beds: 1, label: "Single" },
  { beds: 2, label: "2 sharing" },
  { beds: 3, label: "3 sharing" },
  { beds: 4, label: "4 sharing" },
  { beds: 5, label: "5 sharing" },
  { beds: 6, label: "6 sharing" },
];

function newRow(): DraftRoomRow {
  return { clientId: crypto.randomUUID(), roomNumber: "", sharingBeds: 3, rentPerBedRupees: 0 };
}

type Props = {
  floorId: string | null;
  floorLabel: string;
  disabled?: boolean;
  onSave: (rows: DraftRoomRow[]) => Promise<void>;
  isSaving: boolean;
};

export function RoomDraftSpreadsheet({ floorId, floorLabel, disabled, onSave, isSaving }: Props) {
  const [rows, setRows] = useState<DraftRoomRow[]>([newRow()]);
  const [bulkFrom, setBulkFrom] = useState(101);
  const [bulkTo, setBulkTo] = useState(110);
  const [bulkSharing, setBulkSharing] = useState(3);
  const [bulkRent, setBulkRent] = useState(7000);

  const validRows = useMemo(
    () => rows.filter((r) => r.roomNumber.trim().length > 0 && r.sharingBeds >= 1 && r.sharingBeds <= 12),
    [rows],
  );

  function updateRow(id: string, patch: Partial<DraftRoomRow>) {
    setRows((prev) => prev.map((r) => (r.clientId === id ? { ...r, ...patch } : r)));
  }

  function duplicateLast() {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return [...prev, newRow()];
      const num = parseInt(last.roomNumber, 10);
      const nextNum = Number.isFinite(num) ? String(num + 1) : `${last.roomNumber} copy`;
      return [
        ...prev,
        {
          clientId: crypto.randomUUID(),
          roomNumber: nextNum,
          sharingBeds: last.sharingBeds,
          rentPerBedRupees: last.rentPerBedRupees,
        },
      ];
    });
  }

  function applyBulkRange() {
    const a = Math.min(bulkFrom, bulkTo);
    const b = Math.max(bulkFrom, bulkTo);
    const generated: DraftRoomRow[] = [];
    for (let n = a; n <= b; n++) {
      generated.push({
        clientId: crypto.randomUUID(),
        roomNumber: String(n),
        sharingBeds: bulkSharing,
        rentPerBedRupees: bulkRent,
      });
    }
    setRows((prev) => [...prev.filter((r) => !r.roomNumber.trim()), ...generated]);
  }

  async function handleSave() {
    const toSave = validRows;
    if (!toSave.length) return;
    await onSave(toSave);
    setRows([newRow()]);
  }

  const noFloor = !floorId;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Add rooms</h2>
          <p className="text-sm text-slate-600">
            Enter room number, sharing, and rent for each space. We create everything else for you.
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Adding to: <span className="text-slate-800">{floorLabel}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
        <p className="text-sm font-medium text-slate-800">Fill a range quickly</p>
        <p className="mt-0.5 text-xs text-slate-600">Example: 101 to 110, all same type and rent.</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="text-xs font-medium text-slate-600">
            From
            <Input
              type="number"
              className="mt-1 h-11 w-full min-w-[5rem] text-base lg:w-24"
              value={bulkFrom}
              onChange={(e) => setBulkFrom(Math.floor(Number(e.target.value)) || 0)}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            To
            <Input
              type="number"
              className="mt-1 h-11 w-full min-w-[5rem] text-base lg:w-24"
              value={bulkTo}
              onChange={(e) => setBulkTo(Math.floor(Number(e.target.value)) || 0)}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Sharing
            <select
              className="mt-1 h-11 w-full min-w-[8rem] rounded-lg border border-slate-200 bg-white px-2 text-base lg:w-40"
              value={bulkSharing}
              onChange={(e) => setBulkSharing(Number(e.target.value))}
            >
              {SHARING_OPTIONS.map((o) => (
                <option key={o.beds} value={o.beds}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Rent each (₹)
            <Input
              type="number"
              min={0}
              step={100}
              className="mt-1 h-11 w-full min-w-[6rem] text-base lg:w-32"
              value={bulkRent}
              onChange={(e) => setBulkRent(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <Button type="button" variant="secondary" className="h-11 w-full shrink-0 lg:w-auto" onClick={applyBulkRange}>
            Add range to list
          </Button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="px-3 py-3 sm:px-4">Room number</th>
              <th className="px-3 py-3 sm:px-4">Sharing</th>
              <th className="px-3 py-3 sm:px-4">Rent each (₹)</th>
              <th className="px-3 py-3 sm:px-4">Total room (₹)</th>
              <th className="px-3 py-3 sm:px-4">Status</th>
              <th className="px-3 py-3 sm:px-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const total = row.sharingBeds * row.rentPerBedRupees;
              return (
                <tr key={row.clientId} className="border-b border-slate-100 last:border-0">
                  <td className="p-2 sm:p-3">
                    <Input
                      className="h-11 min-w-[5rem] text-base font-medium"
                      placeholder="e.g. 105"
                      value={row.roomNumber}
                      onChange={(e) => updateRow(row.clientId, { roomNumber: e.target.value })}
                      disabled={disabled || noFloor}
                    />
                  </td>
                  <td className="p-2 sm:p-3">
                    <select
                      className="h-11 w-full min-w-[7rem] rounded-lg border border-slate-200 bg-white px-2 text-base"
                      value={row.sharingBeds}
                      onChange={(e) => updateRow(row.clientId, { sharingBeds: Number(e.target.value) })}
                      disabled={disabled || noFloor}
                    >
                      {SHARING_OPTIONS.map((o) => (
                        <option key={o.beds} value={o.beds}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 sm:p-3">
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      className="h-11 min-w-[6rem] text-base"
                      value={row.rentPerBedRupees || ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? 0 : Math.max(0, Number(e.target.value) || 0);
                        updateRow(row.clientId, { rentPerBedRupees: v });
                      }}
                      disabled={disabled || noFloor}
                    />
                  </td>
                  <td className="px-3 py-3 text-base font-semibold tabular-nums text-slate-800 sm:px-4">
                    ₹{total.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500 sm:px-4">New</td>
                  <td className="p-2 sm:p-3">
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                      disabled={rows.length <= 1 || disabled}
                      onClick={() => setRows((prev) => prev.filter((r) => r.clientId !== row.clientId))}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full sm:w-auto"
          onClick={() => setRows((prev) => [...prev, newRow()])}
          disabled={disabled || noFloor}
        >
          + Add row
        </Button>
        <Button type="button" variant="secondary" className="h-11 w-full sm:w-auto" onClick={duplicateLast} disabled={disabled || noFloor}>
          Duplicate last row
        </Button>
        <Button
          type="button"
          className="h-11 w-full sm:ml-auto sm:w-auto sm:min-w-[10rem]"
          disabled={disabled || noFloor || !validRows.length || isSaving}
          onClick={() => void handleSave()}
        >
          {isSaving ? "Saving…" : `Save ${validRows.length} room${validRows.length === 1 ? "" : "s"}`}
        </Button>
      </div>
      {noFloor ? <p className="mt-3 text-sm text-amber-800">Add a floor first, then pick it above.</p> : null}
    </section>
  );
}
