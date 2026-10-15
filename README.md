# Studio — Footer & ExitKit

A single-page creative studio website featuring an interactive eye-tracking character video footer, coupled with the open-source **ExitKit** dependency maintenance engine and agent skill.

---

## 1. Creative Studio Footer (UI / UX)

### Visual & Interactive Highlights
- **Full Viewport Desktop Character**: On desktop screens (`> 700px`), the video fills the entire viewport behind the content (`z-index: -1`, `object-fit: cover`).
- **Pointer-Driven Eye Tracking**: As the mouse moves across the screen, the character's pupils dynamically track the cursor. This is powered by an exact non-linear angle calibration table (`gaze-frames.json`) rather than linear animation or fake overlays.
- **Mobile Responsive Flow**: At screens `≤ 700px`, the layout smoothly transitions to stacked content with the video appearing naturally below the content in a full-bleed 4:3 aspect ratio.
- **Accessibility & Motion**: Respects `prefers-reduced-motion` by automatically pausing mobile playback while keeping desktop cursor scrubbing precise.

### Exact Design Tokens & Typography
| Token | Value | Description |
|---|---|---|
| Text & Logo | `#080909` | High contrast foreground |
| Desktop Fallback Background | `#dfe4f2` | Underlying canvas tone |
| Mobile Background | `#f0eefa` | Matched to the top video background |
| Badge Background | `#f7f8fa` | Subtle pill tag background |
| Headlines Font | `Epilogue Black` (900) | Normal style, zero letter-spacing |
| Body Font | `DM Sans Regular` (400) | Clean sans-serif, served locally in `public/fonts/` |

### How the Eye-Tracking Algorithm Works
1. Midpoint between the character's eyes in source coordinates is `(948, 418)` inside a 1920 × 1080 canvas.
2. The cover scale factor is calculated as `max(width / 1920, height / 1080)`.
3. Screen eye coordinates are derived:
   ```ts
   const eyeX = rect.left + rect.width / 2 + (948 - 960) * scale;
   const eyeY = rect.top + rect.height / 2 + (418 - 540) * scale;
   ```
4. `Math.atan2(dy, dx)` calculates the angular direction, ignoring movements within an 8px deadzone radius.
5. The nearest calibrated video timestamp from `gaze-frames.json` is selected using circular distance `min(abs(target - sample), 2π - abs(target - sample))`.
6. Pointer updates are coalesced through `requestAnimationFrame` and applied whenever the video is ready.

---

## 2. ExitKit Maintenance Engine (CLI & Agent Skill)

ExitKit solves one crucial maintenance job: **exiting a risky dependency safely**.

### Core Pillars
1. **Cross-Examined AI**: Open-weight models return atomic claims that deterministic code verifies (`CONFIRMED`, `REFUTED`, or `UNVERIFIABLE`).
2. **Enforced Provenance**: Strict tags in code (`[OBSERVED]`, `[EXECUTED]`, `[AI-GENERATED]`) prevent model hallucinations from masquerading as facts.
3. **Isolated Worktrees**: Proposed patches are tested and verified in disposable git worktrees without touching your working branch.
4. **Re-runnable Evidence**: Outputs a validated `capsule.json` and `capsule.md` that anyone can re-verify using `exitkit verify`.

---

## 3. Local Development & Commands

### Prerequisites
- Node.js 18+ (tested on Node.js 24)
- Python 3.10+ (for Python ecosystem tests)

### Running the Web Application
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Create optimized production build
npm run build

# Start production server
npm run start
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive studio footer.

### Running ExitKit CLI Commands
```bash
# Display CLI help and available commands
node exitkit/bin/exitkit.js --help

# Scan dependencies in a repository
node exitkit/bin/exitkit.js scan .

# Score dependency maintenance risks (unbounded versions, vendor lock-in)
node exitkit/bin/exitkit.js risk .

# Map dependency footprint (imports, call sites, difficulty score)
node exitkit/bin/exitkit.js usages . <package-name>

# Execute baseline verification checks
node exitkit/bin/exitkit.js checks .

# Run full 15-test suite for the CLI engine
npm run test:cli
```

---

## 4. Project Structure
```
├── app/
│   ├── brand-logo.tsx         # Outlined Logoipsum SVG component
│   ├── footer-background.tsx  # Interactive pointer scrub video controller
│   ├── gaze-frames.json       # Calibrated angle-to-timestamp lookup
│   ├── globals.css            # Exact CSS rules & responsive @media queries
│   ├── layout.tsx             # Root layout with local typography & metadata
│   └── page.tsx               # Studio single-page footer
├── public/
│   ├── fonts/                 # DMSans-Regular.woff2 & Epilogue-Black.woff2
│   ├── footer-scrub.mp4       # Video asset for cursor scrubbing
│   ├── logo.svg               # Standalone Studio vector logo
│   ├── linkedin.svg           # Social SVG icon
│   ├── instagram.svg          # Social SVG icon
│   └── tiktok.svg             # Social SVG icon
├── exitkit/                   # Standalone zero-dependency CLI engine & skill
│   ├── bin/exitkit.js         # Executable CLI
│   ├── src/                   # Scanner, risk, usages, verifiers, capsule builder
│   ├── references/            # capsule-schema.json & provenance rules
│   └── test/                  # Unit and end-to-end test suite
└── README.md                  # Project documentation
```
