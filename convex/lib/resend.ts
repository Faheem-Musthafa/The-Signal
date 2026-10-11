import { signUnsubToken } from "./unsubToken";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 20_000;

export type SendEmailArgs = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  listUnsubscribeUrl: string;
};

export type EmailConfig = {
  resendKey: string;
  emailFrom: string;
  unsubSecret: string;
  siteUrl: string;
  postalAddress: string | null;
};

// Returns null (and logs) when any required Resend/site setting is missing.
export function loadEmailConfig(logPrefix: string): EmailConfig | null {
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const unsubSecret = process.env.UNSUB_SECRET;
  const siteUrl = process.env.SITE_URL;

  if (!resendKey || !emailFrom || !unsubSecret || !siteUrl) {
    const missing = [
      !resendKey && "RESEND_API_KEY",
      !emailFrom && "EMAIL_FROM",
      !unsubSecret && "UNSUB_SECRET",
      !siteUrl && "SITE_URL",
    ].filter(Boolean);
    console.warn(`${logPrefix} missing config (${missing.join(", ")}); skipping`);
    return null;
  }

  const postalAddress = process.env.EMAIL_POSTAL_ADDRESS?.trim() || null;
  if (!postalAddress) {
    console.warn(`${logPrefix} EMAIL_POSTAL_ADDRESS is not set; emails will omit the postal address (required by CAN-SPAM)`);
  }

  return { resendKey, emailFrom, unsubSecret, siteUrl: siteUrl.replace(/\/+$/, ""), postalAddress };
}

export async function buildFooterLinks(config: EmailConfig, accountId: string) {
  const token = await signUnsubToken(config.unsubSecret, accountId);
  return {
    unsubUrl: `${config.siteUrl}/api/unsubscribe?u=${encodeURIComponent(accountId)}&t=${encodeURIComponent(token)}`,
    privacyUrl: `${config.siteUrl}/privacy`,
    manageUrl: `${config.siteUrl}/newsletter`,
    postalAddress: config.postalAddress,
  };
}

export async function sendEmail(args: SendEmailArgs): Promise<{ id?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify({
        from: args.from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
        headers: {
          "List-Unsubscribe": `<${args.listUnsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Resend send timed out after ${SEND_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed (status ${response.status}): ${body.slice(0, 240)}`);
  }

  const data = (await response.json()) as { id?: string };
  return { id: data.id };
}
