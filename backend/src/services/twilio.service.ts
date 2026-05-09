import twilio from "twilio";
import { loadEnv } from "../config/env.js";
import { internal } from "../common/httpErrors.js";
import { logger } from "./logger.service.js";

function getClient() {
  const env = loadEnv();
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

/**
 * Twilio expects addresses like `whatsapp:+15551234567`.
 * `.env` files often use `whatsapp:+1555…` already; avoid `whatsapp:whatsapp:+…`.
 */
function toWhatsAppTwilioAddress(raw: string): string {
  const trimmed = raw.trim();
  const withoutScheme = trimmed.replace(/^whatsapp:/i, "").trim();
  const e164 = withoutScheme.startsWith("+") ? withoutScheme : `+${withoutScheme}`;
  return `whatsapp:${e164}`;
}

/** Local dev: skip Twilio and print OTP to server logs (never use in production). */
function shouldEmitOtpToConsoleOnly(): boolean {
  return (
    process.env.NODE_ENV === "development" && process.env.AUTH_OTP_CONSOLE === "1"
  );
}

export async function sendOtpMessage(params: {
  phone: string;
  channel: "sms" | "whatsapp";
  code: string;
}): Promise<void> {
  if (shouldEmitOtpToConsoleOnly()) {
    logger.warn({
      message: "otp_dev_console",
      channel: params.channel,
      phone: params.phone,
      code: params.code,
      hint: "AUTH_OTP_CONSOLE=1 is set; no SMS/WhatsApp was sent. Unset it and configure Twilio for real delivery.",
    });
    return;
  }

  const env = loadEnv();
  const body = `PG Manager: your login code is ${params.code}. It expires in 5 minutes. Do not share this code.`;

  try {
    if (params.channel === "whatsapp") {
      await getClient().messages.create({
        from: toWhatsAppTwilioAddress(env.TWILIO_WHATSAPP_NUMBER),
        to: toWhatsAppTwilioAddress(params.phone),
        body,
      });
      return;
    }

    await getClient().messages.create({
      from: env.TWILIO_PHONE_NUMBER,
      to: params.phone,
      body,
    });
  } catch (err) {
    const twilioCode =
      err && typeof err === "object" && "code" in err ? (err as { code?: number }).code : undefined;
    const twilioStatus =
      err && typeof err === "object" && "status" in err ? (err as { status?: number }).status : undefined;
    logger.error({
      message: "twilio_send_failed",
      channel: params.channel,
      phone: params.phone,
      twilioCode,
      twilioStatus,
      err,
    });
    throw internal("Failed to send OTP. Try again shortly.");
  }
}

export async function sendPlainSms(params: {
  to: string;
  body: string;
}): Promise<void> {
  const env = loadEnv();
  try {
    await getClient().messages.create({
      from: env.TWILIO_PHONE_NUMBER,
      to: params.to,
      body: params.body,
    });
  } catch (err) {
    logger.error({ message: "twilio_sms_failed", err });
    throw internal("Failed to send SMS. Try again shortly.");
  }
}

/** WhatsApp session message (same channel as OTP). Returns Twilio SID or throws. */
export async function sendWhatsAppPlain(params: {
  toE164: string;
  body: string;
}): Promise<{ sid: string }> {
  const env = loadEnv();
  const msg = await getClient().messages.create({
    from: toWhatsAppTwilioAddress(env.TWILIO_WHATSAPP_NUMBER),
    to: toWhatsAppTwilioAddress(params.toE164),
    body: params.body,
  });
  return { sid: msg.sid };
}

/** SMS without mapping to HTTP error — callers handle retries/logging. */
export async function sendSmsPlain(params: {
  to: string;
  body: string;
}): Promise<{ sid: string }> {
  const env = loadEnv();
  const msg = await getClient().messages.create({
    from: env.TWILIO_PHONE_NUMBER,
    to: params.to,
    body: params.body,
  });
  return { sid: msg.sid };
}
