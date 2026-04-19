import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { WifiLoader } from "react-awesome-loaders";

export function LandingHero() {
  return (
    <div className="relative z-10 w-full max-w-7xl flex flex-col items-center animate-fade-in-up mt-8 md:mt-12">

      {/* Hero Section */}
      <div className="text-center w-full max-w-4xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-[10px] md:text-xs font-medium uppercase tracking-widest mb-8 text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          The Intelligence Platform
        </div>

        <h1 className="text-6xl md:text-[7rem] font-semibold tracking-tighter mb-8 text-white leading-[0.95]">
          Signal <span className="text-white/40 italic font-playfair font-normal">vs</span> Noise
        </h1>

        <p className="text-lg md:text-2xl text-text-muted max-w-2xl mx-auto font-light leading-relaxed mb-12">
          Your personal intelligence agency. We monitor, synthesize, and deliver actionable briefings on the topics that drive your industry.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <SignUpButton mode="modal">
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Start Free Trial
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 bg-transparent hover:bg-white/5 transition-colors text-sm font-medium text-white">
              Log In
            </button>
          </SignInButton>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full px-4">

        {/* Main large card */}
        <div className="col-span-1 md:col-span-8 p-8 md:p-12 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 max-w-lg">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <h3 className="text-2xl md:text-4xl font-medium mb-4 text-white tracking-tight">Live Synthesis Engine</h3>
            <p className="text-text-muted text-base md:text-lg leading-relaxed mb-8">
              Our models aggregate data across thousands of live sources in real-time, delivering an executive summary in seconds. No waiting. No fluff.
            </p>

            {/* Mockup UI embedded */}
            <div className="w-full bg-black/40 rounded-xl border border-white/10 p-5 font-mono text-[10px] md:text-xs text-white/50 relative shadow-2xl">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="text-accent mb-1.5 animate-pulse"> initializing search vector...</div>
              <div className="mb-1.5"> querying 4,203 sources for "AI & LLMs"</div>
              <div className="text-white/80 mb-1.5">compiling executive briefing</div>
              <div className="text-green/80 mt-3 font-semibold">✓ Briefing ready (1.2s)</div>
            </div>
          </div>
        </div>

        {/* Top right card */}
        <div className="col-span-1 md:col-span-4 p-8 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-warm/20 blur-[50px] rounded-full group-hover:bg-accent-warm/30 transition-colors duration-500" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <h3 className="text-xl md:text-2xl font-medium mb-2 text-white">3 Daily Briefings</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Sign up today and receive up to 3 premium briefings every single day, completely free of charge. No credit card required.
            </p>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-6xl font-playfair italic text-white/90 leading-none">3</span>
              <span className="text-xs uppercase tracking-widest font-semibold text-accent-warm pb-1">/ Day</span>
            </div>
          </div>
        </div>

        {/* Bottom left card */}
        <div className="col-span-1 md:col-span-5 p-8 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col">
            <h3 className="text-xl md:text-2xl font-medium mb-2 text-white">Absolute Privacy</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Your radar configuration and reading habits remain completely private. We don't train models on your specific interests.
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 opacity-10 transform group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>

        {/* Bottom right large card */}
        <div className="col-span-1 md:col-span-7 p-8 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 md:w-1/2">
            <h3 className="text-xl md:text-2xl font-medium mb-2 text-white">Zero Friction</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              No complex dashboards. Simply select your radar targets, and click generate. We handle the heavy lifting.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/80">AI & LLMs</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/80">Startups</span>
              <span className="px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/30 text-xs font-medium text-accent">Generate ↗</span>
            </div>
          </div>

          <div className="md:w-1/2 h-full flex items-center justify-center p-4">
            <div className="w-full h-32 rounded-xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/10 flex items-center justify-center shadow-inner">
               <WifiLoader
                 background={"transparent"}
                 desktopSize={"60px"}
                 mobileSize={"60px"}
                 text={""}
                 backColor="#222222"
                 frontColor="#FF453A"
               />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
