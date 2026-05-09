export declare function sendOtpMessage(params: {
    phone: string;
    channel: "sms" | "whatsapp";
    code: string;
}): Promise<void>;
