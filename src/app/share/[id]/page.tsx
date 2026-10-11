import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_NAME } from "@/components/siteUrl";
import { Button, Logo, TopicChip, IconArrowRight } from "@/components/ui";
import { BriefingView } from "@/components/briefing/BriefingView";
import type { Story } from "@/types/digest";
import { getSharedDigest } from "./getSharedDigest";
import { LocalTime } from "./LocalTime";

type Params = { params: Promise<{ id: string }> };

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const digest = await getSharedDigest(id).catch(() => null);

  if (!digest || digest.stories.length === 0) {
    return {
      title: "Briefing not found",
      robots: { index: false, follow: false },
    };
  }

  const lead = digest.stories[0];
  const title = truncate(lead.headline, 90);
  const description = truncate(lead.signal || lead.summary, 200);
  const url = `/share/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      url,
      title,
      description,
      publishedTime: new Date(digest.generatedAt).toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage({ params }: Params) {
  const { id } = await params;
  const digest = await getSharedDigest(id);

  if (!digest) notFound();

  const count = digest.stories.length;
  const topics = digest.topics.length > 0 ? digest.topics : Array.from(new Set(digest.stories.map((s) => s.category)));
  // Stories are validated against StorySchema when they are generated.
  const stories = digest.stories as Story[];

  const header = (
    <header className="max-w-3xl">
      <p className="eyebrow">Shared briefing</p>
      <h1 className="display-lg mt-3">
        <LocalTime value={digest.generatedAt} kind="date" />
      </h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[13px] tabular-nums text-ink-mute">
        <span>
          Made at <LocalTime value={digest.generatedAt} kind="time" />
        </span>
        <span aria-hidden="true" className="text-ink-faint">
          ·
        </span>
        <span>
          {count} {count === 1 ? "story" : "stories"}
        </span>
        <span aria-hidden="true" className="text-ink-faint">
          ·
        </span>
        <span>AI-written summaries</span>
      </p>
      {topics.length > 0 && (
        <ul aria-label="Topics" className="mt-4 flex flex-wrap gap-2">
          {topics.map((t) => (
            <li key={t}>
              <TopicChip topic={t} variant="soft" size="md" />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[14px] text-ink-mute">
        This link works until <LocalTime value={digest.expiresAt} kind="longDate" />.
      </p>
    </header>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <div className="pt-safe sticky top-0 z-30 border-b border-rule/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo size="sm" href="/" />
          <Button href="/" size="md" trailingIcon={<IconArrowRight />}>
            <span className="sm:hidden">Get yours</span>
            <span className="hidden sm:inline">Get your own briefing</span>
          </Button>
        </div>
      </div>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <BriefingView
          mode="public"
          stories={stories}
          meta={{ generatedAt: new Date(digest.generatedAt).toISOString(), topics, shareId: digest.shareId }}
          header={header}
        />

        <p className="mt-10 max-w-3xl text-[13px] leading-relaxed text-ink-mute">
          Summaries are written by AI from public sources and can contain mistakes. Check the original source before you
          rely on a story. Nothing here is financial or investment advice.
        </p>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-[13.5px] text-ink-mute sm:flex-row sm:items-center sm:px-6">
          <span>
            Made with{" "}
            <Link href="/" className="ink-link">
              The Signal
            </Link>
          </span>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href={"/privacy" as Route} className="ink-link inline-flex min-h-11 items-center">
              Privacy
            </Link>
            <Link href={"/terms" as Route} className="ink-link inline-flex min-h-11 items-center">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
