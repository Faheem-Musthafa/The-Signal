import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

export type IconButtonVariant = "ghost" | "surface" | "solid" | "inverse" | "glass";
export type IconButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<IconButtonVariant, string> = {
  /** transparent, ink icon — toolbars on paper */
  ghost: "text-ink-2 hover:bg-ink/[0.06] hover:text-ink",
  /** white chip with hairline */
  surface: "bg-surface text-ink shadow-[inset_0_0_0_1px_rgb(var(--rule-strong-rgb))] hover:bg-surface-2",
  /** brand fill */
  solid: "bg-signal text-white hover:bg-signal-deep",
  /** white on dark/coloured surfaces */
  inverse: "bg-white text-ink hover:bg-white/90",
  /** translucent white on coloured surfaces (story chrome) */
  glass: "bg-white/15 text-white backdrop-blur-sm hover:bg-white/25",
};

const SIZES: Record<IconButtonSize, string> = {
  sm: "size-9 [&_svg]:size-4", // 36px — only for dense desktop UI
  md: "size-11 [&_svg]:size-5", // 44px — default touch target
  lg: "size-14 [&_svg]:size-6",
};

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** Required accessible name (also used as the tooltip title). */
  label: string;
  children: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Hide the native title tooltip */
  noTitle?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

/** Round icon-only button. Always pass `label`. */
export function IconButton({
  label,
  children,
  variant = "ghost",
  size = "md",
  noTitle = false,
  className = "",
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={noTitle ? undefined : label}
      {...rest}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  );
}
