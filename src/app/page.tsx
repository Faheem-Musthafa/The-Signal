import { auth } from "@clerk/nextjs/server";
import { LandingHero } from "@/components/LandingHero";
import { HomeApp } from "./HomeApp";

// Server-rendered entry: signed-out visitors get the landing page in the first
// HTML response (no client-side auth spinner); signed-in users get the app.
export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) return <LandingHero />;
  return <HomeApp />;
}
