import Link from "next/link";
import type { Route } from "next";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "inverse" | "glass";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] " +
  "transition-[background-color,color,box-shadow,transform,border-color] duration-150 ease-out active:scale-[0.97] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-signal text-white shadow-glow hover:bg-signal-deep",
  secondary: "bg-surface text-ink shadow-[inset_0_0_0_1px_rgb(var(--rule-strong-rgb))] hover:bg-surface-2",
  ghost: "bg-transparent text-ink-2 hover:bg-ink/[0.06] hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-deep",
  /** white button for dark / topic-coloured surfaces */
  inverse: "bg-white text-ink hover:bg-white/90 focus-visible:outline-white",
  /** translucent white for dark / topic-coloured surfaces (secondary action there) */
  glass: "bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] hover:bg-white/20 focus-visible:outline-white",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] [&_svg]:size-4",
  md: "h-11 px-5 text-[14.5px] [&_svg]:size-[18px]",
  lg: "h-14 px-7 text-[16px] [&_svg]:size-5",
};

/** Class string for elements that must look like a Button but can't be one (e.g. Clerk's SignInButton child). */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`.trim();
}

function Spinner() {
  // three equaliser bars — on-brand loading indicator
  return (
    <span aria-hidden="true" className="inline-flex h-4 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="animate-eq block h-full w-[3px] rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows the equaliser spinner, sets aria-busy and disables the button. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonAsButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
  };

export type ButtonAsLinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    /** Internal path → next/link (typed routes are cast for you). http(s) URL → new-tab <a>. */
    href: string;
    /** Force new-tab external behaviour even for relative hrefs. */
    external?: boolean;
    prefetch?: boolean;
    disabled?: boolean;
    ref?: Ref<HTMLAnchorElement>;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className = "",
    children,
    ...rest
  } = props;

  const classes = buttonClasses({ variant, size, fullWidth, className });
  const inner = (
    <>
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </>
  );

  if (props.href !== undefined) {
    const { href, external, prefetch, disabled, ...anchorRest } = rest as Omit<ButtonAsLinkProps, keyof CommonProps>;
    const isExternal = external || /^https?:\/\//i.test(href);
    const a11y = disabled || loading ? { "aria-disabled": true as const, tabIndex: -1 } : {};
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...anchorRest} {...a11y} className={classes}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href as Route} prefetch={prefetch} {...anchorRest} {...a11y} className={classes}>
        {inner}
      </Link>
    );
  }

  const { type = "button", disabled, ...buttonRest } = rest as Omit<ButtonAsButtonProps, keyof CommonProps | "href">;
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...buttonRest} className={classes}>
      {inner}
    </button>
  );
}
