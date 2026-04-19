import { internalAction } from "../_generated/server";

export const sendDueDigests = internalAction({
  args: {},
  handler: async () => {
    // Phase 3 hook: wire OpenRouter + Resend scheduled digest delivery.
    return { processed: 0 };
  },
});
