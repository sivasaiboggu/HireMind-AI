# HireMind AI
### Resume checks, mock interviews and study plans

HireMind AI is a single-page app for job preparation. It runs ATS resume audits, mock interview sessions with scorecards, and step-by-step upskilling roadmaps.

---  

## Design System & Premium Aesthetics

HireMind AI implements a custom dark theme visual identity designed using **pure Vanilla CSS** for maximum flexibility and performance.

### Style Variables (`src/styles/globals.css`)
*   **Colors**: Atlas dark theme — deep base backgrounds (`#0D1110`), solid surface modules (`#141A18`), one lime accent (`#C6F24E`), mint secondary (`#5EEAC8`), warm-red danger (`#F26D5C`), and soft-mint phase accents (`#8BE9C8`). Every token is declared in OKLCH with a hex fallback (`src/styles/tokens.json`); the light variant darkens the lime, mint and red so they still pass WCAG AA 4.5:1 as text (TopBar toggle sets `data-theme="light"`).
*   **Typography**:
    *   **Display Headers**: *Syne* (Google Fonts)
    *   **Body & Interfaces**: *Inter* (Google Fonts)
    *   **Stats & Gauges**: *Inter* (numeric)
    *   **Code Elements**: *JetBrains Mono* (Google Fonts)
*   **Background Detail**: Subtle linear background coordinate grid with 1px border lines displayed at `0.03` opacity for depth.
*   **Animations**: Custom keyframes managing page fade-ups, button click scaling, card hover highlights, typing indicators, static skeleton blocks, and slide-in panels. Motion only signals a state change; reduced motion collapses it.

---

## Modular Architecture

The repository is re-organized under a strict `/src` directory to support clean compilation:

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Collapsible nav sidebar, AI credits, custom pulse logo
│   │   ├── TopBar.tsx           # Dynamic header, notifications, and search
│   │   ├── Layout.tsx           # Responsive shell (mobile tab bar, global search CMD+K, toasts)
│   │   ├── GoogleAIKeyConnect.tsx # API key connection panel
│   │   └── WebGLBackground.tsx  # Ambient WebGL backdrop
│   ├── ui/
│   │   ├── Button.tsx           # Primary, ghost, danger, and subtle variants
│   │   ├── Card.tsx             # Solid card wrapper; emphasis is a 1px accent border, never a glow
│   │   ├── Badge.tsx            # Status badge pills (success, warning, danger, info)
│   │   ├── ProgressRing.tsx     # SVG circular gauge (auto count-up, threshold colors)
│   │   ├── ScoreBar.tsx         # Horizontal indicator bars
│   │   ├── Skeleton.tsx         # Shimmer loader skeletons
│   │   ├── ProgressiveLoader.tsx # Staged loading indicator
│   │   ├── Tooltip.tsx          # Context hover popovers
│   │   └── Modal.tsx            # Overlay layout with ESC listener
│   ├── dashboard/
│   │   ├── StatsGrid.tsx        # Responsive metrics panel
│   │   ├── RecentActivity.tsx   # Vertical timeline logs (empty states illustration)
│   │   └── QuickActions.tsx     # Interactive action navigation cards
│   ├── resume/
│   │   ├── ResumeUploader.tsx   # File drag-drop + local PDF.js text extractor
│   │   ├── ResumeAnalysis.tsx   # Side-by-side audit report
│   │   ├── ATSScoreCard.tsx     # Double ring scorecard summaries
│   │   ├── ScoreBreakdown.tsx   # "How your ATS score is built" driver panel
│   │   ├── ImprovementChecklist.tsx # Guided tickable fix list (saved per analysis)
│   │   ├── SectionFeedback.tsx  # Expandable accordion feedbacks
│   │   └── KeywordCloud.tsx     # Match rate progress + tags clouds
│   ├── interview/
│   │   ├── SetupForm.tsx        # Wizards selection cards
│   │   ├── QuestionCard.tsx     # Answer inputs, character counters, hints
│   │   ├── FeedbackPanel.tsx    # Slide-in scores, strengths, model answer
│   │   └── SessionSummary.tsx   # Score break downs, focus areas, logs tables
│   └── roadmap/
│       ├── GoalSetup.tsx        # Inputs pills + auto skill imports
│       ├── RoadmapTimeline.tsx  # Vertical timeline connector nodes
│       ├── PhaseCard.tsx        # Subtopics accordion, checklists progress
│       └── ResourceLinks.tsx    # Material recommendations index
├── pages/
│   ├── Dashboard.tsx            # Main career command board
│   ├── ResumeAnalyzer.tsx       # ATS document audit page
│   ├── InterviewPractice.tsx    # Interactive mock simulator page
│   ├── QuizPractice.tsx         # Written-quiz practice page
│   ├── LearningRoadmap.tsx      # Curriculum planner page
│   └── Auth.tsx                 # Sign-in / sign-up page
├── services/
│   ├── gemini.ts                # central GenerativeModel connector (gemini-2.5-flash)
│   ├── ats.ts                   # Deterministic on-device ATS audit (40/25/15/20)
│   ├── score-breakdown.ts       # Score-driver breakdown + highest-impact fix
│   ├── prompts.ts               # Strict instruction prompts configurations
│   ├── parsers.ts               # JSON formatting regex cleaners
│   ├── generation.ts            # Generation orchestration
│   ├── retry.ts                 # Capped retries with exponential backoff
│   ├── api-errors.ts            # Provider error classification (fail-fast vs retry)
│   ├── ai-key.ts                # API key handling
│   ├── build-safety.ts          # Blocks provider keys from public browser builds
│   ├── supabase.ts              # Supabase client + history/profile persistence
│   ├── dsa-eval.ts              # DSA evaluation helpers
│   ├── python-harness.ts        # Browser-local Python execution (Pyodide)
│   ├── practice-selection.ts    # Unique bundled-prompt selection, no repeats
│   └── mockQuestions.ts         # Bundled practice question catalogs
├── hooks/
│   ├── useGemini.ts             # loading, error, and credit spending hooks
│   └── useCountUp.ts            # Score reveal animation hooks
├── store/
│   └── appStore.ts              # Zustand store for logs, credits, navigation, toasts
├── types/
│   └── index.ts                 # TypeScript contract types definitions
└── styles/
    ├── globals.css              # Custom property variables and resets
    └── animations.css           # Keyframes libraries
```
supabase/ holds the Postgres schema (`migrations/schema.sql`) and the
`gemini-proxy` edge function (server-side AI endpoint; the client routes
through it only when `VITE_GEMINI_PROXY_URL` is set and a user is signed
in — guests and signed-out users use their own key instead).

---

## Tech Stack

*   **Runtime Framework**: React 19 + TypeScript (Strict compiler flags)
*   **Asset Bundler**: Vite 6
*   **Routing Shell**: React Router v7 (`HashRouter` for zero-server deployment)
*   **State Container**: Zustand (localStorage bindings, toast overlays, credits monitoring)
*   **AI Engine**: Google Gemini 2.5 Flash via `@google/generative-ai` SDK
*   **Document Reader**: `pdfjs-dist` (Client-side raw text deconstruction)
*   **Icon Library**: Lucide React

---

## Getting Started



### 1. Installation

Clone the repository and install the NPM packages:
```bash
git clone https://github.com/sivasaiboggu/HireMind-AI.git
cd HireMind-AI
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory and register your Gemini API key:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Development Server

Run the compiler locally:
```bash
npm run dev
```
The app will launch on port `3000`.

### 4. Build Production Bundle

To build the project assets for deployment:
```bash
npm run build
```

### 5. Tests

```bash
npm test        # node:test suites in tests/
npm run typecheck
```

### Reliability notes

- No Gemini key? The resume analyzer still works: if the AI call fails (no
  key, quota, network), it falls back to a deterministic on-device ATS audit
  — keyword coverage vs the job description, section completeness, quantified
  achievements and format — clearly labelled as a local audit. It never
  invents rewrites. Keyword matching is whole-token: "javascript" does not
  count as "java", and "reaction" does not count as "react", so scores are
  not inflated by substring hits. When the local audit runs, the rewrite
  section says so plainly instead of rendering an empty card.
- Every Gemini call is capped at 60s and retried up to 3 times with
  exponential backoff for transient failures (rate limits, 5xx, network).
  Permanent errors (bad key, unknown model) fail fast.
- The results view explains itself: a "How your ATS score is built" panel
  breaks the score into its four drivers (keywords 40, sections 25, format
  15, content 20) using only the audit's own numbers, and names the single
  highest-impact fix. A guided improvement checklist turns every
  recommendation and failed ATS check into a tickable step, saved per
  analysis in localStorage — ticking a step never changes a score; only a
  re-run of the audit does. Rewrite proposals show before/after side by
  side with copy buttons for each improved bullet.
- Heavy pages (resume analyzer with pdf.js, interview, roadmap, quiz) are
  code-split, so the first-load main chunk is ~750 kB (~217 kB gzip)
  instead of ~1.3 MB all-in. Vite still warns that the main chunk exceeds
  500 kB after minification — further splitting is open work, not done.
- Resume PDFs over 5 MB or with no extractable text are rejected with a
  clear message instead of failing silently.

---

## Author & Strategy

**Boggu Sivasai** - Full Stack Developer
*   **GitHub**: [sivasaiboggu](https://github.com/sivasaiboggu)


### AI key deployment boundary

Public browser builds now stop if `GEMINI_API_KEY`, `VITE_GEMINI_API_KEY` or
`API_KEY` is configured. A provider key embedded in JavaScript is visible to
any visitor. Vite no longer copies private server environment variables into
browser code. Keyless builds still work, but hosted AI generation is unavailable
until an authenticated server-side endpoint is implemented and tested. This is
a safety boundary, not a completed backend integration.

For local development only, `VITE_GEMINI_API_KEY` is read by the dev client.
That key is still visible to the browser and anyone who can access that dev
server. Use an isolated, restricted test key and do not expose the dev server.
Never add a provider key to a public hosting build. Previously shipped keys
should be reviewed and revoked/rotated by the account owner; changing this
source does not remove secrets from older deployed bundles. No provider keys
were used, revoked or rotated during this checkpoint.

Failed AI requests no longer deduct client-side credits. Successful requests
charge only after a result is returned, and repeated clicks on the same hook
are blocked while it is running. This is not trusted metering: cross-tab
concurrency and editable browser state still require server-side accounting.
No real balances or stored profiles were changed by the synthetic tests.

History deletion persists to the selected backend before removing the record from
local UI state. A rejected server request or full guest browser storage keeps
the record visible and shows an error, not a false deleted-success message.
Store tests execute with Zustand and mocked Supabase/storage; isolated live
Supabase row-level-policy and storage tests still need a test environment.

Save operations now wait for storage before marking a history item as saved.
Server saves use the returned row UUID directly, avoiding a broad history refresh
that could erase concurrent arrivals. Missing IDs, rejected requests and full
guest storage show an error without adding a falsely persisted item. Results
remain in the current feature view for retry. Late save/delete responses from a
previous account do not change the newly selected account's workspace. Guest
localStorage synchronization is ignored while signed in. Synthetic Zustand
regressions cover these boundaries; they do not replace isolated Supabase E2E.

Roadmap milestone changes also persist before changing saved progress. Local
writes to one roadmap are serialized so rapid toggles preserve both intentions;
unknown milestone IDs are rejected. Failed writes preserve prior progress, and
late responses do not enter another signed-in account. This queue is local to
one JavaScript store, not cross-tab/server concurrency control. Full auth-state
subscription races and isolated Supabase tests remain separate work.

Auth events invalidate earlier account loads and realtime reads. The auth
callback returns synchronously and defers database work; account-bound history
is cleared while a new identity loads. Late responses after sign-out, a newer
auth event or cleanup cannot restore the previous account's data or register its
subscriptions. Five mocked-auth regressions exercise these cases. Live auth,
RLS, token refresh and cross-tab conflict behavior still require isolated E2E;
these tests do not certify production identity isolation on their own.


### Realtime history ordering

History fetch errors now reject rather than masquerading as an empty account.
Failed realtime reads keep the displayed records, and overlapping reads for one
account accept only the newest response. Refreshes keep the selected record if
it still exists. Initial load failures/timeouts show a notice instead of silently
claiming there is no history. Synthetic tests cover each history type; live
Supabase/RLS and multi-tab write ordering remain unverified. This change does not
add server-side AI or quota enforcement, which remain separate work.


### Guest storage container checks

Guest preferences reject incompatible JSON types and negative/non-finite credit
values. History expects arrays of non-null objects, not strings, null or primitive
entries. Invalid stored bytes are left untouched for recovery rather than erased.
A denied theme-storage read no longer prevents store construction. Eight isolated
regressions cover these cases. This is a container/type boundary, not complete
nested-record validation or protection against malicious same-origin scripts;
record-field schema validation remains further work.


### Generated roadmap boundaries

Generated resource links must be explicit HTTP(S) URLs without embedded account
credentials. Executable/data/file links and malformed or absent links are omitted,
not replaced by a made-up Google link. Valid URLs are not proof that a resource
exists or is safe/current; resource verification remains needed. Week counts and
skill-gap percentages are finite and bounded, preserving valid zero percentages.
Two regression tests cover these cases. This source change does not enable the
separately deferred server-side AI feature.


### Assessment scores must come from the response

Resume and interview score parsing now rejects missing, non-finite, boolean,
blank or out-of-range ratings instead of inventing70/100 or5/10. Valid zero and
numeric-string scores are preserved. Malformed responses fail generation before
the existing success-only credit step. Two parser regressions cover this boundary;
no employer ATS accuracy or calibrated assessment quality is claimed.

### Persisted guest history

Guest history is checked before it enters the store, including nested resume
sections, interview configurations/answer feedback, and roadmap topics/resources.
Malformed records are excluded from the displayed history instead of crashing
consumers of nested fields. Valid records in the same array remain available.
Stored zero scores remain zero; no replacement assessment is generated.
Roadmap resources must use HTTP(S) without embedded credentials.

Loading rejected records does not delete or rewrite the original localStorage
bytes. A later explicit save/delete/progress action can still replace that history
key with the current valid records, so this guard is not a backup or repair tool.
These checks cover local guest reads, not validation of every signed-in database
row or a live Supabase/browser session.


### Unavailable answer assessment

Interview and written-quiz handlers no longer create a fixed 7/10 scorecard or
invent strengths when provider evaluation fails. The original answer stays in
place for retry; no interview answer record or quiz scorecard is created by the
failure branch. Valid provider zero scores remain zero. Four handler regressions
cover failure and successful zero-score results; no provider request is made.
This does not establish a working authenticated public AI endpoint or validate
DSA compiler/sandbox behavior.


### DSA execution evidence

C++/Java provider output is advisory AI code review, not a compiler sandbox.
Predictions and provider failures never produce scored test results. Submissions
without nonempty executed test results stay on the current question with the code
intact. JavaScript and available Pyodide Python runs are browser-local execution,
not security-isolated sandboxes. This change does not add a C++/Java compiler,
execution timeout, or server-side isolation. Five handler tests cover unavailable
review, unverified predictions, missing tests and real local-result advancement.

### Mobile practice actions

The mobile shell reserves bottom space for its fixed navigation and safe-area
inset. Practice runner actions wrap and keep at least 44px touch height. A real
390px-wide local viewport was scrolled to the footer: both Run Code and Submit
Solution were visible above navigation, with the unavailable-review notice still
readable. This is a focused footer check, not a full device/keyboard audit.

### Unassessed practice summaries

Skipped or unavailable written-quiz evaluations are shown as Not assessed,
not 0/10 or a failed result. Summary averages include only finite 0-10 ratings
for the current questions, with the assessed count shown separately. An actual
zero rating remains part of that average. Six logic regressions cover empty,
partial, invalid and zero-score cases. Desktop and 390px local application
screenshots were inspected for the all-skipped state; no provider was contacted.

### Unique bundled practice

Bundled practice selects prompts without repeating a short difficulty bucket
under new IDs. It targets a balanced mix where the pool allows it, then fills
from other unused questions. If the pool is smaller than requested, the app
announces the shorter session rather than duplicating prompts. The summary
shows its actual easy/medium/hard mix instead of asserting Equal Split.
Five selector tests cover both bundled catalogs, short tiers, duplicate text,
invalid counts and source preservation. These are practice themes, not verified
company interview histories. AI-generated question quality remains unverified.

## Changelog

### 0.0.7 (22 Nov 2026)
- Master-prompt polish (round 10). Signature idea: the audit ledger — one
  thin lime rule and one tabular figure mark the number that matters on
  each screen; everything else is quiet ink, 1px borders and solid
  surfaces. Design tokens are now OKLCH with hex fallbacks
  (`src/styles/tokens.json`); the light theme darkens the lime, mint and
  red so they pass WCAG AA as text, and both muted greys were lightened
  (dark 3.85:1 to 5.30:1, light 3.54:1 to 5.16:1). New
  `tests/design-tokens.test.cjs` checks every text token's contrast, the
  OKLCH declarations and the tokens.json table on every run.
- No more glows: every coloured box-shadow (`--glow-primary`,
  `--glow-amber`, the lime logo-mark shadow, the red exit-dialog shadow)
  is replaced by a 1px accent-tinted border (`Card` `emphasis`) or a
  neutral multi-layer shadow (modals, command palette, buttons); the
  last purple-blue remnant — indigo `rgba(129, 140, 248, …)` on the
  skills icon, info badge and a quiz chip — is mint now, and the rose
  `rgba(244, 63, 94, …)` tints match the danger token. One display face
  (Syne) and one body face (Inter) everywhere; Clash Display and DM Sans
  are no longer loaded. The WebGL background was left exactly as-is
  (keep-or-remove is still Siva's decision).
- Copy: the dashboard onboarding modal says plainly what the name and
  target role are used for ("Save and continue", not "Initialize
  Workspace"). The resume page now tells the two local-audit causes
  apart: out of credits says so and points at the sidebar refill,
  instead of the generic "AI analysis was unavailable" (new
  `src/services/local-audit.ts`).
- Logic: `ProgressRing` and `ScoreBar` clamp their input
  (`src/services/numbers.ts`) — a score past 100 no longer draws past
  full and a negative value no longer renders a negative width.
  Verified again this round: readiness never discounts a lone signal,
  the out-of-credits error names no PRO plan, the credit bar is clamped
  to 100%, and the no-JD breakdown copy is correct.
- Tests: 178 before, 191 after (new `numbers`, `local-audit` and
  `design-tokens` suites; the copy guard now also fails on glow tokens).

### 0.0.6 (22 Nov 2026)
- Relative asset paths (`base: './'` in `vite.config.ts`): the built app
  was blank from `file://` and GitHub Pages because `dist/index.html`
  referenced absolute `/assets` paths.
- Plain copy: page title and meta no longer make premium or
  AI-superlative claims about the product; loading screens no longer
  shout in all caps about
  "deconstructing documents" and "secure handshakes" — they say what is
  happening, in sentence case. Checkmark, cross, arrow and key glyphs in
  the UI are real icons or plain words. README headings lost their emoji
  and the intro lost its "enterprise-grade" claim.
- One solid accent: logo tiles, buttons, the roadmap timeline connector
  and the auth showcase no longer blend lime into mint; the auth mesh
  glows and the interview card's gradient border are gone, along with
  two dead background classes in `globals.css`. The skeleton shimmer and
  the faint grid textures stay — loading and texture, not decoration.
- Logic: career readiness no longer multiplies a lone signal by 0.95
  (new `src/services/readiness.ts`); the out-of-credits error no longer
  names a PRO plan that does not exist — guests refill and signed-in
  users sync from the sidebar; the sidebar credit bar is clamped to
  100% and its label is honest for signed-in users; the score breakdown
  says keywords were counted as fully covered when no job description
  was given instead of claiming they "were not scored". The WebGL
  background draws one static frame under `prefers-reduced-motion`.
- Tests: new `tests/copy-guard.test.cjs` fails the build on emoji,
  banned marketing words, decorative symbols, frosted surfaces,
  radial glows, entrance animations with per-item delays and
  decorative motion in user-facing text, so the design playbook
  checklist is enforced by the build; plus `tests/readiness.test.cjs`
  and assertions for the no-JD wording and the out-of-credits message.
  References for the round saved in `DESIGN_REFERENCES.md`.
- Playbook pass (same release): every frosted surface is now solid
  (top bar, sidebar panels, cards, modals, overlays, toasts,
  interview controls and captions); entrance animations with
  per-item delays, shimmer skeletons, the floating upload icon, the
  pulsing logo dot and the loading screen's glow blobs, dot pattern
  and pulsing ring are gone; toasts fade in instead of springing up;
  data figures use tabular numerals. The auth page no longer claims
  worldwide users or encryption it cannot promise: it says what the
  app does in plain words. Full suite re-verified: 178 tests passed,
  0 failed.

### 0.0.5 (21 Nov 2026)
- Senior logic review, DSA practice timer: the countdown used to run the
  expiry handler (toast + auto-submit) from inside a `setSecondsLeft`
  updater, which React may invoke twice under StrictMode — double toast
  and double auto-submit — and the handler closed over the code as of the
  last effect run, so a timeout could submit the starter template instead
  of what the user typed. The tick is now a pure function
  (`src/services/dsa-timer.ts`: 20/35/50 minutes by difficulty, tick
  computed before any state write, expiry handled once outside the
  updater); the timeout submits the latest editor code via a ref, and the
  runner executes exactly the code it is handed, so the saved answer and
  the executed code can no longer disagree. A double-click on Submit
  Solution used to run the full suite twice and advance two questions,
  skipping one — a submit guard now drops the second call.
- Senior logic review, test-case verdicts: public-only runs return fewer
  results than there are cases, but the problem panel matched them by
  position, so a hidden case listed first showed the wrong case's
  pass/fail chip. Results now carry their original case index and the
  panel looks them up by it.
- Senior logic review, credits and storage: `useCredit` deducted credits
  locally and returned success even when the Supabase sync failed, so the
  spend was silently refunded on the next reload; a failed sync now rolls
  the deduction back and fails closed. Direct `localStorage.setItem`
  calls in theme/sidebar toggles, sign-out, guest mode and guest credit
  writes threw outright when storage was denied or full; they now go
  through a safe helper that returns false instead, and the Dashboard
  reads guest name/role through it too. `addToast` finally honours its
  declared `duration` instead of always using 4000 ms. The report
  download no longer revokes its object URL synchronously, which could
  cancel the download in Firefox.
- Premium UI pass: nine Tailwind-style class names used by the quiz page
  were dead code with no Tailwind configured — the loading spinner never
  spun and was not a circle, the Pyodide overlay sat in flow instead of
  covering the editor, and the interview score ring stacked as blocks
  above the number. They are now defined as compat utilities in
  `globals.css` next to `.text-cyan`; the loading ring was verified live
  in headless Chrome (spinBrain 1s, 95px circle, absolute).
- Premium UI pass, mobile results: with an analysis that has rewrites
  (the normal AI case) the results page scrolled horizontally to 399px
  on a 390px viewport — the `1fr` grid track is `minmax(auto, 1fr)`, so
  the nowrap rewrite copy-button row sized the track past the viewport.
  The results grids now use `minmax(0, ...)` and the per-rewrite header
  row wraps; re-verified live at 390px with zero horizontal overflow.
  (Round 7's no-overflow check used a rewrite-free seed, which is why
  this was missed.)
- Full suite re-verified: 168 tests passed, 0 failed (147 before, 21
  new: DSA timer service, quiz submit/expiry/chip cases, store credit
  rollback and storage-denied cases, layout regressions). Typecheck and
  production build pass. Deno proxy verified by parse + Node harness
  only — no Deno binary in the VM, as in round 7. Headless Chrome
  renders of dashboard, uploader, results (desktop + mobile), quiz
  setup, loading screen and DSA workspace (desktop + mobile) verified
  with zero JS errors and no horizontal overflow; the only console
  entries are external font-CDN failures from the sandbox network.

### 0.0.4 (21 Nov 2026)
- Premium UI pass: priority badges no longer wrap mid-label; the audit
  banner's signal follows the overall score (Strong / On track / Needs
  work) instead of claiming "ATS SIGNAL ACTIVE" for every resume; the
  auth loading screen now uses the Atlas lime/mint theme and the sidebar
  "H" mark instead of an orange/purple gradient and a pause icon; the
  empty dashboard ATS stat is a muted dash and the empty Recent
  Activities state is a neutral pulse, not an alert icon; copy buttons
  stay on one line on narrow screens.
- Senior logic review: `Node.js` and `Node` now match as one skill (in
  either direction) without letting "js" alone claim `node.js`, and
  version numbers still never cross-match; en-dash, middle-dot and
  numbered bullets count toward content; the ATS checklist looks sections
  up by name instead of by position; one unscorable AI section degrades
  to "could not be scored" instead of discarding the whole analysis; the
  score breakdown no longer claims its four drivers sum to an AI score
  they did not produce; guest history is capped at 20 records with a
  quota-safe retry; same-tick double submits are dropped by a
  synchronous guard; re-selecting a failed PDF fires again and the
  dropzone no longer flickers on drag; the gemini-proxy reads chunked
  bodies through a capped stream instead of buffering them unbounded.
  Full suite re-verified: 147 tests passed, 0 failed. Headless renders
  of dashboard, uploader and results (desktop + mobile) verified with
  zero console errors and no horizontal overflow.

### 0.0.3 (21 Nov 2026)
- Premium resume UI pass: defined the missing `--text-md` and
  `--accent-warning` design tokens (24 headings and the warning accents
  were silently falling back); staggered score-ring entrance with
  Strong / On track / Needs work verdicts; overall score now shown in
  the audit banner; before/after rewrites numbered with tinted rails
  and a desktop arrow divider; resume grids moved from per-render
  inline `<style>` blocks to `globals.css`; warning badge/section
  accents now derive from the warning token; score bars expose
  `role=progressbar`; accordion headers and the upload dropzone are
  keyboard-operable.
- Senior logic review: education year ranges no longer count as a
  phone number (needs a 10+ digit run); `C++`/`C#` survive tokenizing
  and match job keywords; PDF upload claims success only after text
  is extracted, tolerates missing MIME types, and caps parsing at 40
  pages; re-submitting while an analysis runs no longer saves a
  spurious local audit; gemini-proxy enforces its 1 MB cap in bytes
  (with a Content-Length pre-check) and prunes stale rate-limit
  entries. Full suite re-verified: 137 tests passed, 0 failed.

### 0.0.2 (21 Nov 2026)
- Safe patch/minor dependency updates (React 19.3.1, react-router-dom
  7.18.6, supabase-js 2.119.2, framer-motion 12.43, lucide-react 1.77,
  zustand 5.1.0, Vite 6.4.6); removed unused `@google/genai`.
- Fixed hover states that never worked: Tailwind-style `hover:*` class
  names were dead code (no Tailwind configured) and two `hover:` keys in
  React style objects were silently ignored — replaced with real CSS
  `:hover` rules. Full suite re-verified: 134 tests passed, 0 failed.
- README corrected to match the code (React 19, Router v7, Gemini
  2.5 Flash, Atlas lime theme, Syne/Inter/JetBrains Mono, full `src/`
  tree, ~750 kB first-load main chunk).

### 0.0.1 (21 Nov 2026)
- Patch release: no feature changes. Dockerfiles do not exist for this
  repo (Vite SPA, deployed on Vercel), so there was nothing to
  build-test. Full suite re-verified: 134 tests passed, 0 failed.
