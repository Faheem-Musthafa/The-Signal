import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/components/siteUrl";

const PRIVATE_PATHS = ["/api/", "/settings", "/briefings", "/briefing/", "/newsletter"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE_PATHS, "/share/"],
      },
      {
        // Link-preview bots honour robots.txt; let them fetch shared briefings (and their OG images)
        // so pasted links unfurl. The share pages themselves carry a noindex robots meta tag.
        userAgent: ["Twitterbot", "facebookexternalhit", "LinkedInBot", "Slackbot", "Discordbot"],
        allow: ["/", "/share/"],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
