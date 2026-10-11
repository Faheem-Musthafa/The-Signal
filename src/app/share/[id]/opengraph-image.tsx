import { ImageResponse } from "next/og";
import { topicStyle } from "@/lib/topicStyle";
import { FONT, OG, OgBars, OgGlyph, OgLogo, broadcastFonts, clip } from "../../_og/broadcast";
import { getSharedDigest } from "./getSharedDigest";

export const alt = "A shared tech briefing from The Signal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Fallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        color: "#ffffff",
        fontFamily: FONT.body,
        background: `radial-gradient(circle at 15% 0%, rgba(47,75,255,0.6), rgba(47,75,255,0) 60%), ${OG.ink}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <OgLogo size={48} inverse />
        <div style={{ display: "flex", fontFamily: FONT.display, fontSize: 32, fontWeight: 800 }}>The Signal</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: FONT.mono, fontSize: 20, fontWeight: 600, letterSpacing: 2.4, color: "rgba(255,255,255,0.7)" }}>
          SHARED BRIEFING
        </div>
        <div style={{ display: "flex", marginTop: 16, fontFamily: FONT.display, fontSize: 84, fontWeight: 800, lineHeight: 1, letterSpacing: -2.5 }}>
          Tech news you tap through.
        </div>
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const digest = await getSharedDigest(id).catch(() => null);

  if (!digest || digest.stories.length === 0) {
    const fonts = await broadcastFonts("The SignalSHARED BRIEFINGTech news you tap through.");
    return new ImageResponse(<Fallback />, { ...size, fonts });
  }

  const [lead, ...rest] = digest.stories;
  const t = topicStyle(lead.category);
  const count = digest.stories.length;
  const dateLabel = new Date(digest.generatedAt)
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })
    .toUpperCase();
  const headline = clip(lead.headline, 96);
  const takeaway = lead.signal ? clip(lead.signal, 110) : "";
  const next = rest.slice(0, 3).map((s) => ({ headline: clip(s.headline, 62), style: topicStyle(s.category) }));
  const countLabel = `${count} ${count === 1 ? "story" : "stories"}`;
  const headlineSize = headline.length > 70 ? 44 : headline.length > 45 ? 52 : 60;

  const fonts = await broadcastFonts(
    [
      "The Signal",
      "SHARED BRIEFING",
      "THE SIGNAL",
      "Play as stories",
      "Up next",
      "UP NEXT",
      dateLabel,
      countLabel,
      headline,
      takeaway,
      t.short.toUpperCase(),
      ...next.map((n) => n.headline),
    ].join(""),
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: OG.paper, color: OG.ink, fontFamily: FONT.body }}>
        {/* Lead story as a story card in its broadcast colour */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 700,
            height: "100%",
            padding: "52px 56px 56px",
            color: "#ffffff",
            background: `radial-gradient(circle at 100% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0) 55%), ${t.color}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <OgLogo size={40} inverse />
            <div style={{ display: "flex", fontFamily: FONT.display, fontSize: 26, fontWeight: 800 }}>The Signal</div>
            <div
              style={{
                display: "flex",
                marginLeft: "auto",
                fontFamily: FONT.mono,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: 2,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              SHARED BRIEFING
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
                fontSize: 17,
                fontWeight: 500,
              }}
            >
              <OgGlyph paths={t.glyph} size={17} color="#ffffff" />
              {t.short.toUpperCase()}
            </div>
            <div style={{ display: "flex", marginLeft: "auto" }}>
              <OgBars value={lead.importance} color="#ffffff" height={26} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontFamily: FONT.display,
              fontSize: headlineSize,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -1.2,
            }}
          >
            {headline}
          </div>

          {takeaway && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "auto",
                padding: "16px 20px",
                borderRadius: 18,
                background: "#ffffff",
                color: OG.ink,
              }}
            >
              <div style={{ display: "flex", fontFamily: FONT.mono, fontSize: 13, fontWeight: 600, letterSpacing: 1.8, color: t.color }}>
                THE SIGNAL
              </div>
              <div style={{ display: "flex", marginTop: 6, fontSize: 21, fontWeight: 500, lineHeight: 1.3 }}>{takeaway}</div>
            </div>
          )}
        </div>

        {/* Briefing rundown */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "52px 48px 52px 44px" }}>
          <div style={{ display: "flex", fontFamily: FONT.mono, fontSize: 16, fontWeight: 600, letterSpacing: 1.8, color: OG.mute }}>{dateLabel}</div>
          <div style={{ display: "flex", marginTop: 10, fontFamily: FONT.display, fontSize: 46, fontWeight: 800, letterSpacing: -1.2 }}>
            {countLabel}
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 16 }}>
            {digest.stories.map((s, i) => (
              <div key={i} style={{ display: "flex", flex: 1, height: 6, borderRadius: 3, background: topicStyle(s.category).color }} />
            ))}
          </div>

          {next.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 30 }}>
              <div style={{ display: "flex", fontFamily: FONT.mono, fontSize: 13, fontWeight: 600, letterSpacing: 1.8, color: OG.mute }}>UP NEXT</div>
              {next.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 10,
                      background: n.style.color,
                    }}
                  >
                    <OgGlyph paths={n.style.glyph} size={18} color="#ffffff" />
                  </div>
                  <div style={{ display: "flex", flex: 1, fontSize: 20, fontWeight: 500, lineHeight: 1.25, color: OG.ink2 }}>{n.headline}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", marginTop: "auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "13px 22px",
                borderRadius: 999,
                background: OG.ink,
                color: "#ffffff",
                fontSize: 19,
                fontWeight: 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M7 4.5v15l13-7.5z" fill="#ffffff" />
              </svg>
              Play as stories
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
