import { ImageResponse } from "next/og";
import { TOPIC_STYLES, topicStyle } from "@/lib/topicStyle";
import { FONT, OG, OgBars, OgGlyph, OgLogo, broadcastFonts } from "./_og/broadcast";

export const alt = "The Signal — tech news you tap through. AI briefings, played like stories.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEADLINE = ["Tech news", "you tap", "through."];
const KICKER = "AI tech briefings · played like stories";
const CARD = {
  topic: "AI & LLMs",
  headline: "Your briefing, one story at a time.",
  signal: "Tap for the next story. Tap Tap to save one.",
};

export default async function Image() {
  const ai = topicStyle(CARD.topic);
  const fonts = await broadcastFonts(
    [
      "The Signal",
      ...HEADLINE,
      KICKER.toUpperCase(),
      CARD.headline,
      CARD.signal,
      "THE SIGNAL",
      ai.short.toUpperCase(),
      "01/05",
    ].join(""),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: OG.paper,
          color: OG.ink,
          fontFamily: FONT.body,
          position: "relative",
        }}
      >
        {/* broadcast rings behind the phone */}
        <svg width="760" height="760" viewBox="0 0 760 760" style={{ position: "absolute", right: -140, top: -65 }}>
          {[170, 240, 310, 380].map((r, i) => (
            <circle key={r} cx="380" cy="380" r={r} fill="none" stroke={OG.signal} strokeOpacity={0.2 - i * 0.04} strokeWidth="2" />
          ))}
        </svg>

        {/* left: wordmark, headline, progress */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 0 56px 72px", width: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <OgLogo size={48} />
            <div style={{ display: "flex", fontFamily: FONT.display, fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>The Signal</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {HEADLINE.map((line, i) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  fontFamily: FONT.display,
                  fontSize: 92,
                  fontWeight: 800,
                  lineHeight: 0.98,
                  letterSpacing: -3,
                  color: i === 0 ? OG.ink : OG.signal,
                }}
              >
                {line}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 34, width: 340 }}>
              {[1, 1, 0.55, 0, 0].map((fill, i) => (
                <div key={i} style={{ display: "flex", flex: 1, height: 8, borderRadius: 4, background: "rgba(14,18,32,0.1)" }}>
                  <div style={{ display: "flex", width: `${fill * 100}%`, height: 8, borderRadius: 4, background: OG.signal }} />
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontFamily: FONT.mono,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 2.4,
                color: OG.ink2,
              }}
            >
              {KICKER.toUpperCase()}
            </div>
          </div>

          {/* the eight topic frequencies */}
          <div style={{ display: "flex", gap: 8, width: 560 }}>
            {TOPIC_STYLES.map((t) => (
              <div key={t.key} style={{ display: "flex", flex: 1, height: 12, borderRadius: 6, background: t.color }} />
            ))}
          </div>
        </div>

        {/* right: the phone */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 40 }}>
          <div
            style={{
              display: "flex",
              width: 300,
              height: 540,
              padding: 10,
              borderRadius: 48,
              background: OG.ink,
              boxShadow: "0 40px 80px -30px rgba(14,18,32,0.55)",
              transform: "rotate(4deg)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                borderRadius: 38,
                padding: "26px 22px 22px",
                color: "#ffffff",
                background: `radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2), rgba(255,255,255,0) 60%), ${ai.color}`,
              }}
            >
              <div style={{ display: "flex", gap: 5 }}>
                {[1, 0.6, 0, 0, 0, 0].map((fill, i) => (
                  <div key={i} style={{ display: "flex", flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.3)" }}>
                    <div style={{ display: "flex", width: `${fill * 100}%`, height: 4, borderRadius: 2, background: "#ffffff" }} />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 34 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.18)",
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  <OgGlyph paths={ai.glyph} size={15} color="#ffffff" />
                  {ai.short.toUpperCase()}
                </div>
                <div style={{ display: "flex", fontFamily: FONT.mono, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>01/05</div>
                <div style={{ display: "flex", marginLeft: "auto" }}>
                  <OgBars value={5} color="#ffffff" height={20} />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  marginTop: 22,
                  fontFamily: FONT.display,
                  fontSize: 34,
                  fontWeight: 800,
                  lineHeight: 1.02,
                  letterSpacing: -0.8,
                }}
              >
                {CARD.headline}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 22,
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "#ffffff",
                  color: OG.ink,
                }}
              >
                <div style={{ display: "flex", fontFamily: FONT.mono, fontSize: 12, fontWeight: 600, letterSpacing: 1.6, color: ai.color }}>
                  THE SIGNAL
                </div>
                <div style={{ display: "flex", marginTop: 6, fontSize: 17, fontWeight: 500, lineHeight: 1.3 }}>{CARD.signal}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: "auto" }}>
                {[100, 92, 70].map((w, i) => (
                  <div key={i} style={{ display: "flex", width: `${w}%`, height: 9, borderRadius: 5, background: "rgba(255,255,255,0.35)" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
