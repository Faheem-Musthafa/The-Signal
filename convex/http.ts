import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

type ClerkEmailAddress = { id?: string; email_address?: string };
type ClerkWebhookEvent = {
  type: string;
  data: {
    id?: string;
    primary_email_address_id?: string | null;
    email_addresses?: ClerkEmailAddress[];
  };
};

const MAX_BODY_BYTES = 256 * 1024;

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[clerk.webhook] CLERK_WEBHOOK_SECRET not configured");
      return new Response("Webhook not configured", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing signature headers", { status: 400 });
    }

    const payload = await request.text();
    if (payload.length > MAX_BODY_BYTES) {
      return new Response("Payload too large", { status: 413 });
    }

    // svix v2's verify() throws on a bad signature and returns nothing, so parse the body ourselves.
    try {
      new Webhook(secret).verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (error) {
      console.warn(`[clerk.webhook] signature verification failed: ${error instanceof Error ? error.message : "unknown"}`);
      return new Response("Invalid signature", { status: 400 });
    }

    let event: ClerkWebhookEvent;
    try {
      event = JSON.parse(payload) as ClerkWebhookEvent;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    if (!event || typeof event.type !== "string" || typeof event.data !== "object" || event.data === null) {
      return new Response("Unexpected payload", { status: 400 });
    }

    const accountId = typeof event.data.id === "string" && event.data.id.length > 0 ? event.data.id : null;

    switch (event.type) {
      case "user.deleted": {
        if (!accountId) break;
        await ctx.runMutation(internal.internal.accounts.purgeAccount, { accountId });
        break;
      }
      case "user.updated": {
        if (!accountId) break;
        const addresses = Array.isArray(event.data.email_addresses) ? event.data.email_addresses : [];
        const primary = addresses.find((e) => e?.id === event.data.primary_email_address_id);
        if (typeof primary?.email_address === "string") {
          await ctx.runMutation(internal.internal.accounts.syncPrimaryEmail, {
            accountId,
            email: primary.email_address,
          });
        }
        break;
      }
      default:
        break;
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
