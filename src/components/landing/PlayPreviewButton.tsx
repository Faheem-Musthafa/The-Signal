"use client";

import { useState } from "react";
import { SignUpButton } from "@clerk/nextjs";
import { Button, IconArrowRight, IconPlay, buttonClasses, type ButtonVariant } from "@/components/ui";
import { StoryPlayer, type StoryLike } from "@/components/story";

type PlayPreviewButtonProps = {
  stories: StoryLike[];
  generatedAt: number | null;
  label?: string;
  variant?: ButtonVariant;
  className?: string;
};

/** "Play briefing" for the server-rendered landing preview. The list above it works without JS. */
export function PlayPreviewButton({
  stories,
  generatedAt,
  label = "Today's top stories",
  variant = "secondary",
  className = "",
}: PlayPreviewButtonProps) {
  const [open, setOpen] = useState(false);
  if (stories.length === 0) return null;

  return (
    <>
      <Button
        variant={variant}
        className={className}
        leadingIcon={<IconPlay />}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        Play briefing
      </Button>
      <StoryPlayer
        open={open}
        onClose={() => setOpen(false)}
        stories={stories}
        startIndex={0}
        label={label}
        meta={{
          generatedAt: generatedAt ?? undefined,
          topics: Array.from(new Set(stories.map((s) => s.category))),
        }}
        endActions={
          <SignUpButton mode="modal">
            <button type="button" className={buttonClasses({ variant: "inverse", fullWidth: true })}>
              Get my briefing — free
              <IconArrowRight />
            </button>
          </SignUpButton>
        }
      />
    </>
  );
}
