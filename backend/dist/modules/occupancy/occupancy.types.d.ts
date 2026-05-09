/** Derived room-level state for floor map / vacancy (not stored on Room row). */
export type RoomOccupancyStatus = "VACANT" | "PARTIAL_VACANCY" | "PENDING" | "OVERDUE" | "MAINTENANCE" | "OCCUPIED_PAID";
/** Rent signal for an occupied bed, from invoices + paidThrough. */
export type RentDisplayStatus = "NONE" | "CURRENT" | "PENDING" | "OVERDUE";
export type BedOperationalTone = "VACANT" | "MAINTENANCE" | "OVERDUE" | "PENDING" | "PAID";
