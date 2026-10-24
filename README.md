# 🧠 HireMind AI 🤖
### *Premium AI-Powered Career Strategy OS & Intelligence Hub*

HireMind AI is an enterprise-grade, single-page career strategic strategy platform. It empowers candidates to run detailed ATS resume audits, participate in mock interview simulators with scorecards, and outline step-by-step upskilling timelines.

---  

## 🎨 Design System & Premium Aesthetics

HireMind AI implements a custom dark theme visual identity designed using **pure Vanilla CSS** for maximum flexibility and performance.

### Style Variables (`src/styles/globals.css`)
*   **Colors**: Deep obsidian backgrounds (`#050A0F`), frosted glass surface modules (`#0A1628`), electric cyan/teal primary highlights (`#00D4AA`), warning ambers (`#F59E0B`), danger roses (`#F43F5E`), and indigo/purple phases (`#818CF8`).
*   **Typography**:
    *   **Display Headers**: *Clash Display* (Fontshare CDN)
    *   **Body & Interfaces**: *DM Sans* (Google Fonts)
    *   **Stats & Gauges**: *Syne* (Google Fonts)
    *   **Code Elements**: *JetBrains Mono* (Google Fonts)
*   **Background Detail**: Subtle linear background coordinate grid with 1px border lines displayed at `0.03` opacity for depth.
*   **Animations**: Custom keyframes managing page fade-ups, button click scaling, card hover highlights, typing indicators, skeleton loading shimmers, and slide-in panels.

---

## 🏗 Modular Architecture

The repository is re-organized under a strict `/src` directory to support clean compilation:

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Collapsible nav sidebar, AI credits, custom pulse logo
│   │   ├── TopBar.tsx           # Dynamic header with PRO badge, notifications, and search
│   │   └── Layout.tsx           # Responsive shell (mobile tab bar, global search CMD+K, toasts)
│   ├── ui/
│   │   ├── Button.tsx           # Primary, ghost, danger, and subtle variants
│   │   ├── Card.tsx             # Glass card wrapper with backdrop filter blur
│   │   ├── Badge.tsx            # Status badge pills (success, warning, danger, info)
│   │   ├── ProgressRing.tsx     # SVG circular gauge (auto count-up, threshold colors)
│   │   ├── ScoreBar.tsx         # Horizontal indicator bars
│   │   ├── Skeleton.tsx         # Shimmer loader skeletons
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
│   └── LearningRoadmap.tsx      # Curriculum planner page
├── services/
│   ├── gemini.ts                # central GenerativeModel connector
│   ├── prompts.ts               # Strict instruction prompts configurations
│   └── parsers.ts               # JSON formatting regex cleaners
├── hooks/
│   ├── useGemini.ts             # loading, error, and credit spending hooks
│   ├── useCountUp.ts            # Score reveal animation hooks
│   └── useLocalStorage.ts       # Storage syncing hooks
├── store/
│   └── appStore.ts              # Zustand store for logs, credits, navigation, toasts
├── types/
│   └── index.ts                 # TypeScript contract types definitions
└── styles/
    ├── globals.css              # Custom property variables and resets
    └── animations.css           # Keyframes libraries
```

---

## 🛠 Tech Stack

*   **Runtime Framework**: React 18 + TypeScript (Strict compiler flags)
*   **Asset Bundler**: Vite 6
*   **Routing Shell**: React Router v6 (`HashRouter` for zero-server deployment)
*   **State Container**: Zustand (localStorage bindings, toast overlays, credits monitoring)
*   **AI Engine**: Google Gemini 1.5 Flash via `@google/generative-ai` SDK
*   **Document Reader**: `pdfjs-dist` (Client-side raw text deconstruction)
*   **Icon Library**: Lucide React

---

## 🚀 Getting Started



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

---

## 👤 Author & Strategy

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
