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

