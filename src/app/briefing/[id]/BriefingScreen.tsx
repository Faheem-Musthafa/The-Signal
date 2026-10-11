"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Story } from "@/types/digest";
import { AppShell } from "@/components/AppShell";
import { BriefingView } from "@/components/briefing/BriefingView";
import { useSeenBriefings } from "@/app/briefings/useSeenBriefings";

type BriefingScreenProps = {
  shareId: string;
  stories: Story[];
  topics: string[];
  generatedAt: string;
};

export function BriefingScreen({ shareId, stories, topics, generatedAt }: BriefingScreenProps) {
  const router = useRouter();
  const { markSeen } = useSeenBriefings();

  useEffect(() => {
    markSeen(shareId);
  }, [markSeen, shareId]);

  return (
    <AppShell pageTitle="Your briefing">
      <BriefingView
        stories={stories}
        meta={{ generatedAt, topics, shareId }}
        mode="app"
        onNewBriefing={() => router.push("/")}
      />
    </AppShell>
  );
}
