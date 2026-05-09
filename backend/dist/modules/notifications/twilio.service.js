import twilio from "twilio";
import { loadEnv } from "../../config/env.js";
import { internal } from "../../common/httpErrors.js";
import { logger } from "../../lib/logger.js";
function client() {
    const env = loadEnv();
    return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}
export async function sendOtpMessage(params) {
    const env = loadEnv();
    const body = `PG Manager: your login code is ${params.code}. It expires in 5 minutes. Do not share this code.`;
    try {
        if (params.channel === "whatsapp") {
            await client().messages.create({
                from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${params.phone}`,
                body,
            });
            return;
        }
        await client().messages.create({
            from: env.TWILIO_PHONE_NUMBER,
            to: params.phone,
            body,
        });
    }
    catch (err) {
        logger.error({ err }, "twilio_send_failed");
        throw internal("Failed to send OTP. Try again shortly.");
    }
}
//# sourceMappingURL=twilio.service.js.map