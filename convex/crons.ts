import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

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
  "send scheduled digests",
  { hours: 1 },
  internal.internal.subscribers.sendDueDigests,
  {},
);

export default crons;
