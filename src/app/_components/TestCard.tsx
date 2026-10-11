import { TOPIC_STYLES } from "@/lib/topicStyle";

/**
 * Broadcast "please stand by" test card built from the eight topic colours.
 * Decorative; pure markup so it works in server components, error boundaries
 * and global-error (which renders without the root layout's fonts).
 */
export function TestCard({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className="mx-auto w-[220px] rounded-[26px] bg-ink p-2 shadow-lift">
      <div className="grain relative flex h-[132px] overflow-hidden rounded-[19px]">
        {TOPIC_STYLES.map((t) => (
          <span key={t.key} className="h-full flex-1" style={{ background: t.color }} />
        ))}
        <span className="absolute inset-x-0 bottom-0 flex h-7">
          {TOPIC_STYLES.slice()
            .reverse()
            .map((t) => (
              <span key={t.key} className="h-full flex-1 opacity-70" style={{ background: t.soft }} />
            ))}
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-ink px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-soft">
            {label}
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between px-2 pb-0.5 pt-2">
        <span className="flex items-end gap-[3px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="block w-[4px] rounded-full bg-white/25" style={{ height: 3 + i * 2.5 }} />
          ))}
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">CH --</span>
      </div>
    </div>
  );
}
