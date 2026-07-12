import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateDigestStories, SUPPORTED_TOPICS } from "../lib/llm";

const RUN_INTERVAL_MS = 5 * 3_600_000;

// Generates the briefing shown on the public landing page. Runs on a 5-hour
// cron; each run rotates to a different pair of topics so the showcase stays
// fresh and varied.
export const generateShowcaseDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    const slot = Math.floor(Date.now() / RUN_INTERVAL_MS);
    const first = slot % SUPPORTED_TOPICS.length;
    // offset of 3 is coprime with 8 topics, so pairs cycle through all combos
    const second = (first + 3) % SUPPORTED_TOPICS.length;
    const topics = [SUPPORTED_TOPICS[first], SUPPORTED_TOPICS[second]];

    const { stories, model } = await generateDigestStories(topics);
    if (stories.length === 0) {
      console.warn("showcase digest: no stories generated, keeping previous digest");
      return null;
    }

    await ctx.runMutation(internal.digests.saveDigestInternal, {
      accountId: "system:showcase",
      topics,
      stories,
      model,
      topicsKey: [...topics].sort().join("|"),
    });
    return null;
  },
});
