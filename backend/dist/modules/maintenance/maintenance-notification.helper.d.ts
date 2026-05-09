export declare function notifyManagersNewTicket(params: {
    organizationId: string;
    ticketId: string;
    title: string;
}): Promise<void>;
export declare function notifyAssignee(params: {
    organizationId: string;
    assigneeUserId: string;
    ticketId: string;
    title: string;
}): Promise<void>;
export declare function notifyTenantTicketResolved(params: {
    organizationId: string;
    tenantUserId: string;
    ticketId: string;
    title: string;
}): Promise<void>;
