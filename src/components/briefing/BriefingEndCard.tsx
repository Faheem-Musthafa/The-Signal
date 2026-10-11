"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button, IconArrowRight, IconCheck, IconMail, IconPlay, IconReplay, IconShare } from "@/components/ui";
import { briefingShareUrl, shareOrCopy, useIsClient, useRequireAccount } from "@/components/story";
import { DailyEmailOptIn } from "./DailyEmailOptIn";
import { briefingWhen } from "./time";
import type { BriefingMode } from "./BriefingView";

export type BriefingEndCardProps = {
  mode: BriefingMode;
  total: number;
  generatedAt: string;
  topics: ReadonlyArray<string>;
  shareId?: string;
  onNewBriefing?: () => void;
  onReplay: () => void;
};

export async function shareBriefing(shareId: string) {
  await shareOrCopy({
    url: briefingShareUrl(shareId),
    title: "My tech briefing on The Signal",
    text: "The stories that matter today, ranked.",
    copiedMessage: "Link copied. It works for 30 days.",
  });
}

export function AiNote() {
  return (
    <p className="mt-6 max-w-[65ch] text-[13px] leading-relaxed text-ink-mute">
      Summaries and &ldquo;Why it matters&rdquo; notes are written by AI from public sources and can contain mistakes. Check the
      original source before acting on anything.
    </p>
  );
}

function CaughtUpHeading({ total, generatedAt, lead }: { total: number; generatedAt: string; lead?: string }) {
  const isClient = useIsClient();
  const when = isClient ? briefingWhen(generatedAt) : "";
  return (
    <>
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success ring-8 ring-success-soft/50"
      >
        <IconCheck size={24} strokeWidth={2.6} />
      </span>
      <h2 id="caught-up-title" className="display-sm mt-5">
        You&apos;re caught up
      </h2>
      <p className="mt-1.5 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-2">
        {lead ?? (
          <>
            That&apos;s all {total} {total === 1 ? "story" : "stories"}
            {when ? <span suppressHydrationWarning> from {when.replace(" · ", " at ")}</span> : null}.
          </>
        )}
      </p>
    </>
  );
}

/** Default "You're caught up" card, tailored to where the briefing is being read. */
export function BriefingEndCard({ mode, total, generatedAt, topics, shareId, onNewBriefing, onReplay }: BriefingEndCardProps) {
  const router = useRouter();
  const requireAccount = useRequireAccount();
  const shell = "rounded-story bg-surface p-6 shadow-soft ring-1 ring-rule sm:p-8";

  if (mode === "app") {
    return (
      <section aria-labelledby="caught-up-title" className={shell}>
        <CaughtUpHeading total={total} generatedAt={generatedAt} />
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
          <DailyEmailOptIn topics={topics} />
          <div className="flex flex-col gap-2">
            {onNewBriefing ? (
              <Button variant="primary" size="lg" fullWidth leadingIcon={<IconReplay />} onClick={onNewBriefing}>
                New briefing
              </Button>
            ) : (
              <Button href="/" variant="primary" size="lg" fullWidth leadingIcon={<IconReplay />}>
                New briefing
              </Button>
            )}
            {shareId && (
              <Button variant="secondary" size="lg" fullWidth leadingIcon={<IconShare />} onClick={() => void shareBriefing(shareId)}>
                Share briefing
              </Button>
            )}
            <Button variant="ghost" size="lg" fullWidth leadingIcon={<IconPlay />} onClick={onReplay}>
              Play briefing again
            </Button>
          </div>
        </div>
        <AiNote />
      </section>
    );
  }

  if (mode === "preview") {
    const freshBriefing = () => {
      if (requireAccount("Create a free account to get a fresh briefing")) router.push("/");
    };
    const dailyEmail = () => {
      if (requireAccount("Create a free account to get the daily email")) router.push("/newsletter" as Route);
    };
    return (
      <section aria-labelledby="caught-up-title" className={shell}>
        <CaughtUpHeading
          total={total}
          generatedAt={generatedAt}
          lead="This was a recent briefing on your topics. Want one written fresh, right now?"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col justify-between gap-4 rounded-card bg-ink p-5 text-white sm:p-6">
            <div>
              <p className="text-[16px] font-semibold text-white">Get a fresh briefing on these topics</p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-white/75">Free account. 3 fresh briefings a day, ready in under a minute.</p>
            </div>
            <Button variant="inverse" size="lg" fullWidth trailingIcon={<IconArrowRight />} onClick={freshBriefing}>
              Get a fresh briefing
            </Button>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-card bg-signal-soft p-5 sm:p-6">
            <div>
              <p className="text-[16px] font-semibold text-ink">Get this every morning</p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">Your topics, in your inbox at the hour you pick. Free.</p>
            </div>
            <Button variant="primary" size="lg" fullWidth leadingIcon={<IconMail />} onClick={dailyEmail}>
              Get the daily email
            </Button>
          </div>
        </div>
        <AiNote />
      </section>
    );
  }

  return (
    <section aria-labelledby="caught-up-title" className={shell}>
      <CaughtUpHeading total={total} generatedAt={generatedAt} />
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button href="/" variant="primary" size="lg" trailingIcon={<IconArrowRight />}>
          Get your own briefing
        </Button>
        <Button variant="ghost" size="lg" leadingIcon={<IconPlay />} onClick={onReplay}>
          Play briefing again
        </Button>
      </div>
      <AiNote />
    </section>
  );
}
