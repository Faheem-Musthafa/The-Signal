import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "surface" | "sunken" | "outline" | "ink" | "signal";
export type CardPadding = "none" | "sm" | "md" | "lg";

const VARIANTS: Record<CardVariant, string> = {
  surface: "bg-surface border border-rule shadow-soft",
  sunken: "bg-surface-2 border border-transparent",
  outline: "bg-transparent border border-rule",
  ink: "bg-ink text-white border border-ink",
  signal: "bg-signal text-white border border-signal",
};

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-7",
};

export function cardClasses({
  variant = "surface",
  padding = "md",
  interactive = false,
  className = "",
}: { variant?: CardVariant; padding?: CardPadding; interactive?: boolean; className?: string } = {}) {
  return `relative rounded-card ${VARIANTS[variant]} ${PADDING[padding]} ${
    interactive ? "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift" : ""
  } ${className}`.trim();
}

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "aside" | "li";
  variant?: CardVariant;
  padding?: CardPadding;
  /** Hover lift. Use when the whole card is a link/button target. */
  interactive?: boolean;
  children?: ReactNode;
};

/** 14px-radius container. Not interactive by itself — put a Link/button inside. */
export function Card({ as: Tag = "div", variant = "surface", padding = "md", interactive = false, className = "", ...rest }: CardProps) {
  return <Tag {...rest} className={cardClasses({ variant, padding, interactive, className })} />;
}
