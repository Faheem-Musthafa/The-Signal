"use client";

import { ALLOWED_TOPICS, type Topic } from "@/lib/topics";
import { topicStyle } from "@/lib/topicStyle";
import { IconCheck, TopicGlyph } from "@/components/ui";

type TopicTilesProps = {
  selected: readonly Topic[];
  onToggle: (topic: Topic) => void;
  disabled?: boolean;
  /** Accessible name for the group, e.g. "Topics for your daily email". */
  label: string;
  className?: string;
};

/**
 * The eight topics as large toggle tiles (aria-pressed buttons, ≥88px tall).
 * Selected tiles fill with the topic colour. Used by the landing preview,
 * Settings and the Daily email page.
 */
export function TopicTiles({ selected, onToggle, disabled = false, label, className = "" }: TopicTilesProps) {
  return (
    <ul aria-label={label} className={`grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 ${className}`}>
      {ALLOWED_TOPICS.map((topic) => (
        <li key={topic}>
          <TopicTile topic={topic} selected={selected.includes(topic)} disabled={disabled} onToggle={() => onToggle(topic)} />
        </li>
      ))}
    </ul>
  );
}

function TopicTile({
  topic,
  selected,
  disabled,
  onToggle,
}: {
  topic: Topic;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const s = topicStyle(topic);
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={`relative flex h-full min-h-[88px] w-full flex-col justify-between gap-3 overflow-hidden rounded-card p-3 text-left transition-[background-color,box-shadow,transform,color] duration-200 ease-spring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60 motion-safe:active:scale-[0.96] ${
        selected
          ? "grain text-white shadow-soft"
          : "bg-surface text-ink-2 shadow-[inset_0_0_0_1px_rgb(var(--rule-rgb))] hover:shadow-[inset_0_0_0_1px_rgb(var(--rule-strong-rgb))]"
      }`}
      style={selected ? { background: s.color } : undefined}
    >
      <span className="flex items-start justify-between">
        <span
          className="flex size-8 items-center justify-center rounded-[10px]"
          style={selected ? { background: "rgba(255,255,255,0.16)" } : { background: s.soft, color: s.onSoft }}
        >
          <TopicGlyph topic={topic} size={18} strokeWidth={2} />
        </span>
        <span
          aria-hidden="true"
          className={`flex size-5 items-center justify-center rounded-full transition-[opacity,transform] duration-200 ${
            selected ? "scale-100 bg-white opacity-100" : "scale-50 opacity-0"
          }`}
          style={{ color: s.color }}
        >
          <IconCheck size={13} strokeWidth={3} />
        </span>
      </span>
      <span className="text-[14px] font-semibold leading-tight">{topic}</span>
    </button>
  );
}
