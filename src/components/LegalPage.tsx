import Link from "next/link";
import type { Route } from "next";
import { Button, IconChevronLeft, Logo } from "@/components/ui";
import { SIGNAL_WAVE_PATH, TOPIC_STYLES } from "@/lib/topicStyle";

type LegalDoc = "privacy" | "terms";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  /** Which document this is — highlights it in the Privacy/Terms switch. */
  current?: LegalDoc;
  children: React.ReactNode;
};

const DOCS: ReadonlyArray<{ key: LegalDoc; href: string; label: string }> = [
  { key: "privacy", href: "/privacy", label: "Privacy Policy" },
  { key: "terms", href: "/terms", label: "Terms of Service" },
];

export function LegalPage({ eyebrow, title, updated, current, children }: LegalPageProps) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-paper text-ink">
      <div aria-hidden="true" className="flex h-1">
        {TOPIC_STYLES.map((t) => (
          <span key={t.key} className="flex-1" style={{ background: t.color }} />
        ))}
      </div>

      <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo size="sm" href="/" />
          <Button href="/" variant="ghost" leadingIcon={<IconChevronLeft />} className="-mr-2 px-3">
            Back to app
          </Button>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden border-b border-rule">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute -right-16 -top-10 h-[320px] w-[320px] text-signal/[0.09] sm:-right-6 sm:h-[420px] sm:w-[420px]"
          >
            <path d={SIGNAL_WAVE_PATH} stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display-lg mt-3 max-w-[16ch]">{title}</h1>
            <p className="dateline mt-4">
              Last updated <time>{updated}</time>
            </p>

            <nav aria-label="Legal documents" className="mt-7 inline-flex max-w-full rounded-full bg-surface-2 p-1">
              {DOCS.map((doc) => {
                const active = doc.key === current;
                return (
                  <Link
                    key={doc.key}
                    href={doc.href as Route}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex h-11 min-w-0 items-center rounded-full px-4 text-[14px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                      active ? "bg-surface text-ink shadow-soft" : "text-ink-mute hover:text-ink"
                    }`}
                  >
                    <span className="truncate">{doc.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="max-w-3xl rounded-card border border-rule bg-surface px-5 py-7 shadow-soft sm:px-10 sm:py-10">
            <article className="legal-prose">{children}</article>
          </div>
        </div>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-[13px] text-ink-mute sm:px-6 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <span className="font-mono text-[12px] tabular-nums">© {new Date().getFullYear()} The Signal</span>
          <nav aria-label="Legal" className="-mx-3 flex items-center">
            {DOCS.map((doc) => (
              <Link
                key={doc.key}
                href={doc.href as Route}
                className="inline-flex min-h-11 items-center rounded-full px-3 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
              >
                {doc.key === "privacy" ? "Privacy" : "Terms"}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
