'use client';

export default function Footer() {
  return (
    <footer
      aria-label="Footer"
      className="relative w-full border-t border-[#080909]/15 bg-[#f0eefa] text-[#080909] py-16 px-6 lg:px-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col desktop:flex-row justify-between items-start gap-12 relative z-10">
        {/* Left Column */}
        <div className="flex-1 max-w-md space-y-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#f7f8fa] border border-[#080909]/10 rounded-full">
            Ecosystem Migration
          </span>
          <h2 className="font-epilogue font-black text-3xl sm:text-4xl leading-tight text-[#080909]">
            Have a risky
            <br />
            dependency?
          </h2>
          <p className="text-sm text-[#080909]/75 font-sans leading-relaxed">
            ExitKit maps usages, queries open-weight AI for an exit plan, cross-examines claims with deterministic code, and verifies patches in isolated worktrees.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono font-semibold text-[#080909]/70">
            <span className="hover:text-[#080909] cursor-pointer">AGENT SKILL</span>
            <span>•</span>
            <span className="hover:text-[#080909] cursor-pointer">PROVENANCE ENFORCED</span>
            <span>•</span>
            <span className="hover:text-[#080909] cursor-pointer">CLAIM LEDGER</span>
            <span>•</span>
            <span className="hover:text-[#080909] cursor-pointer">ZERO REGRESSION</span>
          </div>
        </div>

        {/* Center / Logo Block */}
        <div className="flex flex-col items-center justify-center py-4 desktop:py-0">
          <div
            role="img"
            aria-label="ExitKit Script Logo"
            className="font-epilogue font-black text-4xl sm:text-5xl tracking-tighter text-[#080909] select-none"
          >
            Exit<span className="text-violet-600">Kit</span>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#080909]/50 uppercase mt-1">
            Evidence-Backed Exits
          </span>
        </div>

        {/* Right Column */}
        <div className="flex-1 max-w-md space-y-4 desktop:text-right">
          <div className="desktop:flex desktop:justify-end">
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#f7f8fa] border border-[#080909]/10 rounded-full">
              Community & Code
            </span>
          </div>
          <h2 className="font-epilogue font-black text-3xl sm:text-4xl leading-tight text-[#080909]">
            Imagination
            <br />
            meets verification.
          </h2>
          <p className="text-sm text-[#080909]/75 font-sans leading-relaxed">
            Other tools ask you to trust the AI report. ExitKit shows you which claims survived code cross-examination.
          </p>

          {/* Social Icons */}
          <div className="pt-3 flex items-center gap-4 desktop:justify-end">
            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-10 h-10 rounded-full bg-[#f7f8fa] border border-[#080909]/15 flex items-center justify-center hover:bg-[#080909] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-[#f7f8fa] border border-[#080909]/15 flex items-center justify-center hover:bg-[#080909] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-10 h-10 rounded-full bg-[#f7f8fa] border border-[#080909]/15 flex items-center justify-center hover:bg-[#080909] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-6.19 6.32 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.06a8.28 8.28 0 0 0 4.77 1.5v-3.4a4.87 4.87 0 0 1-2-.47z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#080909]/10 flex flex-col sm:flex-row justify-between items-center text-xs text-[#080909]/60 font-mono">
        <div>© 2026 ExitKit Project. MIT Licensed. Open Source.</div>
        <div className="mt-2 sm:mt-0 flex gap-6">
          <span>Target: Hermes Skill Deck</span>
          <span>Engine: exitkit CLI 0.1.0</span>
          <span>agentskills.io format</span>
        </div>
      </div>
    </footer>
  );
}
