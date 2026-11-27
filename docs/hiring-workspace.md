# HireMind hiring workspace

HireMind helps a hiring lead review applications, record a decision, and set up an interview. People preparing for their own search can open the career overview, resume review, mock interview, study plan, or practice lab.

## Design brief

The hiring pipeline uses a tabbed register. The stage strip acts as an index, the candidate table is the working surface, and the interview agenda sits in the margin on wide screens. A rank panel sits between the stage strip and the register: paste a job description and the register is ordered by the same audit that scores a single resume, run on the application notes held for each candidate. The agenda uses a dated list, and a candidate record opens in a dialog with its own review and scheduling forms. On small screens the agenda follows the register and the six page links sit in the bottom navigation. The serif masthead appears across the application.

| Accent option | Light theme | Dark theme | Use |
| --- | --- | --- | --- |
| Oxide rust (selected) | `#983521` | `#F0A18B` | A readable action colour on warm paper, with room for a distinct danger colour. |
| Fired clay | `#A04930` | `#EDA88D` | A softer accent for larger fills. |
| Brick red | `#8F302D` | `#F0A39A` | A deeper red with less separation from the danger colour. |

Newsreader Latin variable WOFF2 from Fontsource 5.3.0 is self-hosted under the SIL Open Font License. It carries display and body type from 17 px with 1.6 leading, a 68-character reading measure, and fluid, tightly tracked headings. IBM Plex Mono handles timestamps and code. System fonts cover characters outside the subset.

Spacing uses a 4 px base. Pair icons and labels at 8 px, space labels and content at 12–16 px, inset panels at 16 px on phones and 24 px when space allows, and separate page regions by 32 px. The desktop container uses 56 px gutters and the mobile container uses 16 px. Radii are 4, 8, and 16 px. Hairline rules distinguish neighbouring rows. Three shadow levels serve the register, toasts, and dialogs. Grain appears on the stage strip. Rust is reserved for the active tab, thin progress marks, focus, and primary actions.

View entry takes 240 ms, press feedback 180 ms, and stage or score bars 340 ms. The first five candidate rows enter 32 ms apart within a 338 ms window. CSS transitions animate transforms and opacity. Reduced-motion preferences collapse those transitions and skip the score count-up. The app uses native form controls, the browser's modal focus trap, labelled tab navigation, and a page finder with Ctrl/Cmd+K.

## References studied

| Source | Applied to HireMind |
| --- | --- |
| 21st | Search and status filtering above the candidate table. [Table with Filters](https://dev.21st.dev/@felipemenezes098/components/table-12) |
| Designeer | The direct site was unreachable. Its indexed directory surfaced Inclusive Components, which informed the choice of native controls and explicit accessible labels. [Designeer archive index](https://archive.vn/2026.09.26-133235/https%3A/designeer.xyz/) |
| React Bits | A short fade to distinguish route entry and record editing. [Fade Content](https://reactbits.dev/animations/fade-content) |
| Magic UI | A bounded list entrance when the register first loads or filters add rows. [Animated List](https://magicui.design/docs/components/animated-list) |
| Uiverse | Small press movement on buttons to acknowledge activation. [Animated buttons](https://uiverse.io/ui/animated-buttons) |
| Mobbin | The public library helped compare product flows. Its calendar and board searches were inaccessible, so Luma’s published workflow informed the date-first agenda and explicit time zone. [Mobbin](https://mobbin.com/), [Luma event creation](https://help.luma.com/p/creating-an-event) |
| Inspora | The apex domain was unreachable. The www archive supplied print and wordmark references for serif hierarchy and restrained rules. [Inspora](https://www.inspora.design/), [Inspora logos](https://www.inspora.design/logos) |
| Refero Styles | Serif headlines and a quiet reporting surface. [Steep](https://styles.refero.design/style/75fdb89f-ca64-41b3-af36-7a78bd09448e) |

## Measured contrast

Minimum WCAG relative-luminance ratios across base, surface, elevated, hover, and accent-wash backgrounds. The CSS uses OKLCH with matching sRGB fallbacks. The 12-step neutral ramp and per-surface ratios are in [tokens.json](../src/styles/tokens.json), with [Tailwind aliases](../src/styles/tailwind-theme.css).

| Foreground | Light | Dark | Required |
| --- | ---: | ---: | ---: |
| Primary ink | 13.46 | 11.19 | 4.50 |
| Secondary ink | 6.97 | 7.79 | 4.50 |
| Muted ink | 5.38 | 5.42 | 4.50 |
| Rust | 5.65 | 5.64 | 4.50 |
| Success | 6.04 | 7.13 | 4.50 |
| Warning | 6.23 | 7.21 | 4.50 |
| Danger | 5.66 | 5.93 | 4.50 |
| Control boundary | 3.47 | 3.74 | 3.00 |
| Primary button label on rust fill | 7.04 | 8.12 | 4.50 |

## Pages and flows

| Route | Main action and feedback |
| --- | --- |
| `/#/hiring` | Add a candidate, filter the register, rank the register against a pasted job description, review a record, move stages, and schedule or complete an interview. Empty, loading, storage, validation, and conflict states describe the next action. |
| `/#/dashboard` | Set a target role, inspect preparation scores, search and reopen saved work. |
| `/#/resume` | Paste text or import a PDF, run an audit, then review evidence and edits. |
| `/#/interview` | Set up a mock interview, answer by voice or text, and review feedback. |
| `/#/roadmap`, `/#/quiz` | Build a study plan or run a coding or interview practice session. |
| `/#/auth`, `/#/privacy` | Sign in or continue as a guest, and read where application data is stored. |
| Unknown route and UI error boundary | Return to the overview or reload the app. |

A new candidate starts in Applied. Moving to Review makes the recommendation form available. An Advance recommendation allows the reviewer to pick an interview time. Saving that interview moves the candidate into Interview as one transaction. Marking the interview complete at or after its start time and retaining an Advance recommendation makes Offer available. Closing a record with a scheduled interview cancels its hold in the register. Cancelling a booking leaves the candidate in Interview for rescheduling. Reopening a closed record starts a fresh review and retains the activity log. Interview times use the browser time zone. The calendar file uses UTC and can be imported into an external calendar. Rescheduling an imported event or cancelling an external invitation is handled in that calendar.

## Implementation and audit

The existing Vite, React, TypeScript, and hash-router stack supports static hosting and the current career tools. Zod Mini validates the new form text fields. IndexedDB stores a candidate register per account or guest scope on the device. A candidate has a revision, stage, review, current interview, and chronological activity. Each read, validation, and write runs in one browser transaction. Stale revisions and overlapping scheduled slots are rejected. BroadcastChannel refreshes other views, with window focus also refreshing the register. A selected record can be deleted with confirmation. Career account storage and the Gemini proxy continue to use the existing Supabase integration.

Use Node `24.22.3` and `npm ci` to install the pinned tree. Optional client configuration is `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for sign-in, and `VITE_GEMINI_PROXY_URL` for the authenticated Gemini proxy. `VITE_GEMINI_API_KEY` works only for local development. Hiring runs without these variables. The web manifest starts at the pipeline and includes install icons. The public page includes share metadata and a share image.

The stable npm tags were checked. The existing Vite 6, PDF.js 4, TypeScript 5, Node 22 types, and Vite React plugin 5 baselines have newer majors. Provider migration from the legacy Google SDK needs separate compatibility testing against the career tools and proxy.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run preview -- --port 4177
```

For screenshot and accessibility verification, build merged `main` and serve it separately on port 4176. With Chromium already installed, run the custom runner from this branch.

```sh
npm install --prefix /tmp/hiremind-audit --save-exact playwright-core@1.65.1 axe-core@4.14.1 lighthouse@13.6.0
AUDIT_MODULE_DIR=/tmp/hiremind-audit CHROME_PATH=/usr/bin/chromium \
  node scripts/workspace-audit.mjs http://127.0.0.1:4176/ http://127.0.0.1:4177/ /tmp/hiremind-evidence
```

Serve production assets with compression for the Lighthouse run. The preview binds to loopback and sets immutable caching on fingerprinted assets. Run the first command in a separate terminal.

```sh
python3 scripts/audit-preview.py dist 4187
CHROME_PATH=/usr/bin/chromium /tmp/hiremind-audit/node_modules/.bin/lighthouse   'http://127.0.0.1:4187/' --chrome-flags='--headless --no-sandbox'   --output=json --output-path=/tmp/hiremind-evidence/lighthouse-hiring.json
```

The pull request includes the screenshots, browser audit results, and Lighthouse metrics. [Verification evidence](hiring-v2-evidence/)

## Launch checklist and risks

- Check test, typecheck, build, layout, contrast, axe, and Lighthouse results in the PR.
- Exercise configured OAuth and email sign-in, PDF upload, mock interview permissions, and Python practice on the actual deployment.
- The hiring register is local to the browser profile. Shared workspaces would require server-side permissions, retention controls, and a conflict policy across reviewers.
- Calendar export contains a name and interview topic. Shared calendar handling and invitations are controlled by the importing calendar.
- The app ships English labels, logical CSS properties, and locale-aware dates. Translation and additional font subsets need separate validation.

## Follow-up ideas

1. Shared hiring workspace with role-based access.
2. Structured scorecards per role and interview round.
3. Multiple interview rounds on a single candidate record.
4. Reviewer assignments and reminders.
5. Calendar free/busy checks and invitation updates.
6. Role-specific pipelines and stage policies.
7. Candidate export and workspace retention controls.
8. Accessible bulk actions with change previews.
9. Candidate application intake and duplicate review.
10. Historical cycle-time reporting by stage.
