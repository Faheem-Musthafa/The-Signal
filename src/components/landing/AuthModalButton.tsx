"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

// Clerk's buttons need exactly one child element. Children passed down from a Server
// Component can arrive in a form that fails that check, so the <button> is built here.
export function AuthModalButton({
  kind,
  id,
  className,
  children,
}: {
  kind: "sign-in" | "sign-up";
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const button = (
    <button id={id} type="button" className={className}>
      {children}
    </button>
  );
  return kind === "sign-in" ? (
    <SignInButton mode="modal">{button}</SignInButton>
  ) : (
    <SignUpButton mode="modal">{button}</SignUpButton>
  );
}
