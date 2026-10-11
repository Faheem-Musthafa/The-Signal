"use client";

import { useIsClient } from "@/components/story";

type Kind = "date" | "time" | "longDate";

const FORMATS: Record<Kind, Intl.DateTimeFormatOptions> = {
  date: { weekday: "long", month: "long", day: "numeric" },
  longDate: { month: "long", day: "numeric", year: "numeric" },
  time: { hour: "numeric", minute: "2-digit" },
};

/**
 * Shows a timestamp in the reader's own time zone. The server (and the first
 * client paint) render it in UTC with a clear "UTC" label, so nothing shifts
 * without JS and hydration always matches.
 */
export function LocalTime({ value, kind }: { value: number; kind: Kind }) {
  const isClient = useIsClient();
  const date = new Date(value);
  const text = isClient
    ? date.toLocaleString(undefined, FORMATS[kind])
    : `${date.toLocaleString("en-US", { ...FORMATS[kind], timeZone: "UTC" })}${kind === "time" ? " UTC" : ""}`;
  return <time dateTime={date.toISOString()}>{text}</time>;
}
