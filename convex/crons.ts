import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { SHOWCASE_INTERVAL_HOURS } from "./internal/showcase";

const crons = cronJobs();

crons.interval(
  "cleanup expired digests",
  { hours: 24 },
  internal.internal.cleanup.purgeExpiredDigests,
  {},
);

crons.interval(
  "purge old email queue",
  { hours: 24 },
  internal.internal.cleanup.purgeOldEmailQueue,
  {},
);

crons.interval(
  "purge stale rate limit rows",
  { hours: 24 },
  internal.internal.cleanup.purgeStaleRateLimits,
  {},
);

crons.interval(
  "purge old daily usage",
  { hours: 24 },
  internal.internal.cleanup.purgeOldDailyUsage,
  {},
);

crons.interval(
  "send scheduled digests",
  { hours: 1 },
  internal.internal.subscribers.sendDueDigests,
  {},
);

// At 00:00, 06:00, 12:00 and 18:00 UTC; each run covers the next topic pair.
crons.cron(
  "generate showcase digest for landing page",
  `0 */${SHOWCASE_INTERVAL_HOURS} * * *`,
  internal.internal.showcase.generateShowcaseDigest,
  {},
);

export default crons;
