import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateDigestStories, SUPPORTED_TOPICS } from "../lib/llm";

// Shared with crons.ts so the schedule and the rotation slot can't drift apart.
export const SHOWCASE_INTERVAL_HOURS = 6;
const RUN_INTERVAL_MS = SHOWCASE_INTERVAL_HOURS * 3_600_000;
// The cron fires at fixed UTC hours, usually a little late; this tolerance
// also keeps an early-firing run in the right slot.
const SLOT_SKEW_TOLERANCE_MS = 10 * 60_000;

// Four disjoint pairs covering all 8 topics. At one run every 6h, aligned to
// UTC, every topic gets a fresh showcase briefing each day.
const PAIR_COUNT = SUPPORTED_TOPICS.length / 2;

export function showcaseTopicsForTime(now: number): string[] {
  const slot = Math.floor((now + SLOT_SKEW_TOLERANCE_MS) / RUN_INTERVAL_MS) % PAIR_COUNT;
  return [SUPPORTED_TOPICS[slot], SUPPORTED_TOPICS[slot + PAIR_COUNT]];
}

// Generates the showcase briefings behind the public landing page and the
// signed-out topic preview.
export const generateShowcaseDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    const topics = showcaseTopicsForTime(Date.now());

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
