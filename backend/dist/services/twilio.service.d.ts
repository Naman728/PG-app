export declare function sendOtpMessage(params: {
    phone: string;
    channel: "sms" | "whatsapp";
    code: string;
}): Promise<void>;
export declare function sendPlainSms(params: {
    to: string;
    body: string;
}): Promise<void>;
/** WhatsApp session message (same channel as OTP). Returns Twilio SID or throws. */
export declare function sendWhatsAppPlain(params: {
    toE164: string;
    body: string;
}): Promise<{
    sid: string;
}>;
/** SMS without mapping to HTTP error — callers handle retries/logging. */
export declare function sendSmsPlain(params: {
    to: string;
    body: string;
}): Promise<{
    sid: string;
}>;
