# HireMind UI redesign

HireMind is a web workspace for applicants preparing for technical roles. The flow begins with a concrete piece of work: a resume review, an interview answer, or a study plan.

## Design decisions

**The margin rule.** A short rust rule marks the active page, the title of a working sheet, the leading score, or the next study phase. The same mark appears in HireMind’s H. Neutral lines divide neighbouring sections and define the reading order. The vivid color is reserved for these marks and the occasional primary action. Semantics have their own labels and colors.

**Accent options.** The light and dark versions are listed together.

| Option | Light | Dark | Reason |
| --- | --- | --- | --- |
| Rust, selected | `#953D25` | `#F6A47D` | Warm enough to read as a pencil mark against paper, with room for a red error state. |
| Petrol blue | `#17536C` | `#89C4D8` | Works well with ruled tables and code, but gives the workspace a cooler, more technical character. |
| Olive | `#4C592B` | `#BBC98B` | Sits quietly against paper, but is closer to the success color in result views. |

**Type.** IBM Plex Sans carries display, body, and tabular numbers. IBM Plex Mono is reserved for code and compact metadata. Both are self-hosted Latin WOFF2 subsets with OFL notices beside the assets. The shell uses a 16 px body at 1.6 leading and a 68-character measure. Editorial headings use a fluid scale and tighter tracking. Text in user-supplied languages can fall back to system fonts.

**Layout.** A 4 px base defines spacing. Related controls use 4–12 px gaps, form groups use 16–24 px, and desktop sections use 32–56 px. Narrow layouts stack supporting notes below the form. Corners use 2, 4, or 8 px. A thin rule separates adjacent surfaces. Three neutral shadow levels are available for raised paper, notices, and dialogs. A small grain tile is limited to the readiness sheet.

**Motion.** A 240 ms entrance gives route changes a visual boundary. Press feedback moves a control down 1 px. Scores settle in 360 ms and waiting states use static skeletons or a busy indicator. Reduced motion skips both CSS entrances and number animation. The interview portrait uses a state change and a small audio indicator while speech is active.

**Implementation.** The existing Vite/React hash routes suit a static client with browser-based practice and optional cloud sync. Strict TypeScript, Tailwind v4 theme aliases, Zod validation, Lucide and a native dialog fit that structure. Route chunks stay lazy. Builds without cloud configuration can omit the Supabase client. Existing listeners, provider configuration, history formats, code runners, and database schema remain the integration points. The privacy page describes the existing data paths. The web manifest supplies install metadata and icons, and the public metadata includes a share image.

## Screen plan and results

| Route | Applied layout | Main states and actions |
| --- | --- | --- |
| `/#/dashboard` | Title and next action on the left, readiness sheet on the right. A narrow score ledger gives way to work links, activity and saved records. | Guest or account role setup is inline. A first resume can be reviewed immediately. The history filter, tabs, reopening and deletion work from the same list. Empty readiness uses a dash and tells the user how to get a score. |
| `/#/resume` | Submission worksheet with a supporting note. Results start with one leading ATS score and two supporting scores. The analysis and before/after rewrites use asymmetric reading columns. | Upload PDF or paste text, optionally add a job description, review local or AI results, copy rewrites, download the report, and start another review. Parse, loading, and generation states describe the current operation. |
| `/#/interview` | Interview format and role choices sit in a worksheet. The live workspace puts the question and answer controls beside the interviewer. The review opens with the overall score and an answer ledger. | Full or single round, skill tags, difficulty, count, and video setting feed the existing lobby. The live session retains voice, camera, captions, code editor, notes, timing and review. A labelled answer field brings typing into the live session. Saved reviews show question-level strengths and improvements. |
| `/#/roadmap` | A role and timeline form precedes a ruled phase sequence. The next incomplete phase carries the margin mark. Skill gaps and weekly time sit in the supporting column. | Import from the latest resume, add skills, generate, inspect resources, and mark or reopen phases. Loading and error states keep the same page heading. |
| `/#/quiz` | A tabbed mode selector opens either coding practice or interview questions. The coding brief is narrower than the editor and test output. Session results keep the count, time and difficulty mix. | Start with bundled questions when the provider is unavailable. Run code, inspect cases, submit or review solutions. Interview questions have a response field and feedback. The runner reserves mobile navigation space. |
| `/#/auth` | A compact editorial introduction sits beside a ruled form. | Email/password, account creation, email code, Google, GitHub, and guest entry. Guest-only builds present the available path directly. OTP has labelled fields, paste and resend. |
| `/#/privacy`, unknown routes, error boundary | Same type and margin rule with a single return or recovery action. | Data handling is accessible from sign-in. Unknown routes offer the overview. UI failures offer reload. |

The global shell uses a desktop sidebar, a labelled mobile navigation bar, a theme switch, AI-key connection, credits, activity and account controls. Ctrl/Cmd+K opens the command palette. Arrow keys change the selection, Enter opens it, and Escape returns focus to the previous control.

## Contrast

Ratios use WCAG relative luminance and the sRGB hex equivalents of the OKLCH values. Text pairs target 4.5:1 and the identifying control boundary targets 3:1. The full surface-by-surface table and the 12-step ramp are in `src/styles/tokens.json`. The CSS variables live in `src/styles/globals.css` and map into `src/styles/tailwind-theme.css`.

| Token pair | Light | Dark | Minimum |
| --- | ---: | ---: | ---: |
| `text-primary` on its lowest-contrast supported surface | 12.19:1 | 10.61:1 | 4.50:1 |
| `text-secondary` on its lowest-contrast supported surface | 5.95:1 | 7.65:1 | 4.50:1 |
| `text-muted` on its lowest-contrast supported surface | 5.95:1 | 5.43:1 | 4.50:1 |
| `accent-primary` on its lowest-contrast supported surface | 4.81:1 | 5.63:1 | 4.50:1 |
| `accent-success` on its lowest-contrast supported surface | 5.61:1 | 6.60:1 | 4.50:1 |
| `accent-warning` on its lowest-contrast supported surface | 5.49:1 | 6.29:1 | 4.50:1 |
| `accent-danger` on its lowest-contrast supported surface | 5.01:1 | 5.74:1 | 4.50:1 |
| `border-active` on its lowest-contrast supported surface | 4.35:1 | 3.86:1 | 3.00:1 |
| Primary button label on rust fill | 6.67:1 | 8.85:1 | 4.50:1 |

## Run locally

The checked lockfile pins the dependency tree. The redesign was built with Node 24.22.3 and npm 11.19.1.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run preview
```

Use `npm run dev` for development. Client variables are optional for a guest build. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` together for cloud accounts. Set `VITE_GEMINI_PROXY_URL` to use the configured authenticated proxy. The development-only `VITE_GEMINI_API_KEY` must stay out of public builds. Guest AI features can use a key connected from the workspace.

The direct package versions were checked against npm’s stable tags. This branch adds Tailwind and its Vite plugin at 4.3.5, Zod at 4.6.7, and React type packages at 19.3.0. PDF.js 4.10.38, Vite 6.4.6, its React plugin 5.2.0, TypeScript 5.8.3, and Node 22 declarations are the existing baselines. Their newer major releases would require separate compatibility testing. The current Google SDK is legacy. Changing providers or migrating the SDK would affect response formats and the signed-in proxy, so the redesign uses the existing integration.

## Design review

- Replaced the shader backdrop and glowing portrait ring with solid surfaces and a status rule.
- Collapsed repeated metric cards into ledgers, and moved empty onboarding into the dashboard flow.
- Replaced stacked mode cards with text tabs, account and search overlays with keyboard-trapped dialogs, and click-only phase controls with a checkbox and a disclosure.
- Replaced hard-coded dark editor colors with theme surfaces. The mobile runner and live panels stack before they exhaust available width.
- Kept waiting, empty, success and error copy tied to the operation in progress. Sample content stays inside input hints and test fixtures.

## Launch checklist and risks

- Check test, typecheck, build and browser results in the PR.
- Preview production builds with and without cloud env values. Test Google and GitHub callbacks, password and email-code delivery using the deployed project.
- Check real device permissions and audio for the interview room, a PDF upload, and the Python runtime on the deployment origin.
- Check that the published origin serves `/og.png` and `/robots.txt` at the metadata paths.
- Language delivery remains English. Logical layout properties and isolated labels make localisation possible, and translated content may need different line breaks or font subsets.
- PDF.js and the browser Python runtime retain their external worker/runtime dependencies. Live provider and cloud authentication require a configured account environment.

## Possible follow-up work

1. Compare a revised resume with its previous review.
2. Practise a short sample interview without a provider account.
3. Save interview questions for another practice round.
4. Revisit the topics that earned the lowest scores.
5. Export completed study phases to a calendar.
6. Export or remove account data in a single place.
7. Translate account and preparation flows.
8. Add an offline app shell with deliberate cache invalidation.
9. Migrate the legacy Gemini SDK with provider-contract tests.
10. Add screenshot checks to preview builds in both themes.
