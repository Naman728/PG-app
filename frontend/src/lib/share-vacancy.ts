import {
  amenitiesHint,
  formatRupees,
  readyForMoveIn,
  rentPerSpaceMinor,
  sharingTypeLabel,
  vacantBedCount,
} from "./room-display";
import type { PropertyMapRoom } from "../types/property";

export function buildVacancyShareText(params: {
  orgName: string;
  floorName: string;
  room: PropertyMapRoom;
  contact: string;
}): string {
  const { orgName, floorName, room, contact } = params;
  const vac = vacantBedCount(room);
  const rent = formatRupees(rentPerSpaceMinor(room));
  const share = sharingTypeLabel(room);
  const ready = readyForMoveIn(room) ? "Ready to move in" : "Ask for availability";
  const amen = amenitiesHint(room);
  return [
    `🏠 *${orgName}*`,
    `Room *${room.name}* · ${share}`,
    `• ${vac} space${vac === 1 ? "" : "s"} free`,
    `• ${rent} / month (each)`,
    `• Floor: ${floorName}`,
    amen !== "—" ? `• ${amen}` : null,
    `• ${ready}`,
    contact ? `\n📞 ${contact}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
