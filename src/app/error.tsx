"use client";

import { useEffect } from "react";
import { Button, Logo, IconReplay } from "@/components/ui";
import { TestCard } from "./_components/TestCard";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 py-14 text-ink">
      <div className="w-full max-w-md text-center" role="alert">
        <TestCard label="Stand by" />
        <p className="eyebrow mt-9 justify-center">Error</p>
        <h1 className="display-md mt-3">Something went wrong.</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink-2">
          This page didn&apos;t load properly. Try again. If it keeps happening, come back in a few minutes.
        </p>
        {error.digest && <p className="mt-4 font-mono text-[12px] text-ink-mute">Error code: {error.digest}</p>}
        <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button onClick={() => unstable_retry()} leadingIcon={<IconReplay />}>
            Try again
          </Button>
          <Button href="/" variant="secondary">
            Go to the home page
          </Button>
        </div>
      </div>
      <div className="mt-14">
        <Logo size="sm" href="/" />
      </div>
    </main>
  );
}
