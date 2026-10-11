import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Story } from "@/types/digest";
import { getSharedDigest } from "@/app/share/[id]/getSharedDigest";
import { BriefingScreen } from "./BriefingScreen";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Your briefing",
  robots: { index: false, follow: false },
};

/** Signed-in app view of a briefing. Signed-out visitors get the public share page. */
export default async function BriefingPage({ params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/share/${encodeURIComponent(id)}`);

  const digest = await getSharedDigest(id);
  if (!digest) notFound();

  const stories = digest.stories as Story[];
  const topics = digest.topics.length > 0 ? digest.topics : Array.from(new Set(stories.map((s) => s.category)));

  return (
    <BriefingScreen
      shareId={digest.shareId}
      stories={stories}
      topics={topics}
      generatedAt={new Date(digest.generatedAt).toISOString()}
    />
  );
}
