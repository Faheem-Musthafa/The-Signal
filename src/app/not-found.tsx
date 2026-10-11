import type { Metadata } from "next";
import { Button, Logo, IconArrowRight } from "@/components/ui";
import { TestCard } from "./_components/TestCard";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 py-14 text-ink">
      <div className="w-full max-w-md text-center">
        <TestCard label="404" />
        <p className="eyebrow mt-9 justify-center">Page not found</p>
        <h1 className="display-md mt-3">We can&apos;t find that page.</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink-2">
          The link may be wrong, or it may have expired. Shared briefings work for 30 days after they&apos;re made.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/" trailingIcon={<IconArrowRight />}>
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
