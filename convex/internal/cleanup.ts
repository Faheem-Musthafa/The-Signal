import { internalMutation } from "../_generated/server";

export const purgeExpiredDigests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("digests")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    await Promise.all(expired.map((item) => ctx.db.delete(item._id)));
    return { deleted: expired.length };
  },
});
