/** Normalize stored phone to E.164 for WhatsApp; assumes India if 10 digits. */
export declare function toE164Phone(phone: string): string;
export declare function smsToField(phone: string): string;
