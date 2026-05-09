/** Normalize stored phone to E.164 for WhatsApp; assumes India if 10 digits. */
export function toE164Phone(phone) {
    const digits = phone.replace(/\D/g, "");
    if (phone.trim().startsWith("+")) {
        return `+${digits}`;
    }
    if (digits.length === 10) {
        return `+91${digits}`;
    }
    if (digits.length === 12 && digits.startsWith("91")) {
        return `+${digits}`;
    }
    if (digits.length >= 11 && digits.startsWith("1")) {
        return `+${digits}`;
    }
    return `+${digits}`;
}
export function smsToField(phone) {
    return toE164Phone(phone);
}
//# sourceMappingURL=phone.util.js.map