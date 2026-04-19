import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "cleanup expired digests",
  { hourUTC: 0, minuteUTC: 0 },
  internal.internal.cleanup.purgeExpiredDigests,
);

crons.hourly(
  "send scheduled digests",
  { minuteUTC: 0 },
  internal.internal.subscribers.sendDueDigests,
);

export default crons;
