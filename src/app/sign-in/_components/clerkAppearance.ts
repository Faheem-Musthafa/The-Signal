// Shared Clerk appearance for the Broadcast palette (sign-in, sign-up, settings).
// Hex values mirror the tokens in globals.css; Clerk can't read our RGB-channel vars.

const SANS = "var(--font-geist), ui-sans-serif, system-ui, sans-serif";

export const clerkVariables = {
  colorPrimary: "#2F4BFF",
  colorPrimaryForeground: "#FFFFFF",
  colorDanger: "#D4342C",
  colorSuccess: "#0E8A5F",
  colorBackground: "#FFFFFF",
  colorForeground: "#0E1220",
  colorMutedForeground: "#6A7287",
  colorMuted: "#EEF0F6",
  colorNeutral: "#0E1220",
  colorInput: "#FFFFFF",
  colorInputForeground: "#0E1220",
  colorBorder: "#D3D8E4",
  colorRing: "#2F4BFF",
  colorShadow: "#0E1220",
  fontFamily: SANS,
  fontFamilyButtons: SANS,
  fontFamilyMono: "var(--font-mono), ui-monospace, monospace",
  borderRadius: "0.75rem",
} as const;

/** Shared element overrides (Tailwind classes) for the auth cards. */
export const clerkAuthElements = {
  rootBox: "w-full max-w-[420px]",
  cardBox: "w-full max-w-full rounded-[18px] border border-rule shadow-soft",
  card: "bg-surface",
  headerTitle: "font-display stretch-wide font-extrabold tracking-[-0.02em] text-[22px] text-ink",
  headerSubtitle: "text-ink-mute",
  formButtonPrimary: "h-11 rounded-full text-[14.5px] font-semibold shadow-glow",
  socialButtonsBlockButton: "h-11 rounded-full",
  formFieldInput: "h-11",
  footerActionLink: "font-semibold text-signal hover:text-signal-deep",
} as const;
