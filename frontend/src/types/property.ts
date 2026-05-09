export type BedStatus =
  | "OCCUPIED_PAID"
  | "OCCUPIED_UNPAID"
  | "VACANT"
  | "UNDER_MAINTENANCE";

export type PropertyMapTenant = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

/** Server-computed tone for UI chips (floor-map module). */
export type OperationalBedTone = "VACANT" | "MAINTENANCE" | "OVERDUE" | "PENDING" | "PAID";

export type RentDisplayStatus = "NONE" | "CURRENT" | "PENDING" | "OVERDUE";

export type PropertyMapBed = {
  id: string;
  label: string;
  /** Prisma workflow status (persisted). */
  status: BedStatus;
  monthlyRentMinor: number;
  tenant: PropertyMapTenant | null;
  paidThrough: string | null;
  maintenanceNote: string | null;
  assignedAt: string | null;
  /** ISO — used for rough “days vacant” hints on vacancy views. */
  updatedAt?: string;
  /** Present when loaded from `/floor-map` — prefer for display. */
  storageStatus?: BedStatus;
  operationalTone?: OperationalBedTone;
  rentDisplayStatus?: RentDisplayStatus;
  maintenanceActive?: boolean;
  openMaintenanceCount?: number;
};

/** Server-derived room rollup (floor-map module). */
export type RoomOccupancyStatus =
  | "VACANT"
  | "PARTIAL_VACANCY"
  | "PENDING"
  | "OVERDUE"
  | "MAINTENANCE"
  | "OCCUPIED_PAID";

export type PropertyMapRoom = {
  id: string;
  name: string;
  sharingLabel?: string | null;
  colStart: number;
  colSpan: number;
  rowStart: number;
  rowSpan: number;
  sortOrder: number;
  /** Legacy filter field — mirrors server aggregate for Prisma-style filters. */
  aggregateStatus: BedStatus;
  occupancyStatus?: RoomOccupancyStatus;
  vacantBeds?: number;
  occupiedBeds?: number;
  maintenanceBeds?: number;
  beds: PropertyMapBed[];
};

export type PropertyMapFloor = {
  id: string;
  name: string;
  sortOrder: number;
  gridColumns: number;
  rooms: PropertyMapRoom[];
};

export type PropertyStats = {
  counts: Record<BedStatus, number>;
  totalBeds: number;
  occupancyRate: number;
  monthlyCollectedMinor: number;
  monthlyAtRiskMinor: number;
  monthlyPotentialMinor: number;
};

export type PropertyTenantMember = {
  membershipId: string;
  user: { id: string; name: string | null; phone: string | null };
};
