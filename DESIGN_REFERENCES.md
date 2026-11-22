# Design references — HireMind AI, round 9

Inspiration sites picked before this round's rebuild, per the design
playbook. One line each on what to borrow; the app is designed from
these notes, never from tool defaults.

## Dashboard product (the app itself)

- **Linear** — command-K density and keyboard-first navigation; precise
  8px spacing, quiet borders instead of shadows, one restrained accent.
- **Stripe Dashboard** — data-dense tables with honest numbers, clean
  empty/loading/error states, tabular figures on every amount and score.
- **Vercel dashboard** — dark, sharp, confident; solid surfaces, no
  frosted glass, type that does the work instead of decoration.
- **Raycast** — fast and minimal: one action per row, exact labels,
  no motion that does not signal a state change.
- **Attio** — CRM-grade lists and detail views; dense but readable,
  real data in every row, no placeholder numbers.
- **Mobbin** — real product screens and flows for dashboard spacing
  and hierarchy; check a flow before inventing one.
- **Page Flows** — recorded flows for onboarding and settings; the
  reference for how a first-run setup should actually read.
- **UI Sources** — real screens for stat cards and history lists;
  borrow the density, not the chrome.

## Type, colour, components

- **Typewolf / Fonts In Use** — pairing check: Syne for display,
  Inter for body and data, JetBrains Mono for code. One strong font
  per role, never the default stack.
- **Happy Hues / Color Hunt / Realtime Colors** — the limited palette:
  deep ink base, lime accent, mint secondary, amber warning, warm-red
  danger. One accent, used sparingly.
- **Lucide** — the single icon set, used consistently; no emoji or
  text glyphs standing in for icons.
- **Refero Styles / 21st.dev** — component references for restrained
  motion and spacing; borrow the rhythm, not the effects.

## What this round took from them

Solid surfaces everywhere (no frosted glass), one lime accent with no
gradient blends, static loading placeholders instead of shimmer,
tabular numerals on scores and counts, plain sentence-case copy, and
motion only where a state actually changes (spinner, progress fill,
toast appearing).

## Round 10 — master-prompt polish (22 Nov 2026)

Filled master-prompt Section 1 for this project: resume checks (ATS
score), mock interviews and study plans for a final-year student
preparing for interviews. Core promise: a real, scored audit of your
resume and interview readiness — no invented praise. Tone: direct,
honest, plain. Stack kept as-is (React + Vite + TypeScript); the
master prompt's Next.js default does not apply to an existing app.

**Signature idea — the audit ledger.** One thin lime rule and one
tabular figure mark the number that matters on each screen (ATS score
on the resume page, readiness ring on the dashboard, aggregate score
on the interview summary). Everything else is quiet ink, 1px borders
and solid surfaces. References for this round, same set as round 9
(Linear, Raycast, Mobbin) plus Stripe Dashboard's honest-number tables:
borrow the density and the restraint, not the chrome.

**What changed.** Tokens are OKLCH with hex fallbacks
(`src/styles/tokens.json`, conversions checked with culori); light
accents darkened to pass WCAG AA as text; both muted greys fixed
(dark 3.85:1 → 5.30:1, light 3.54:1 → 5.16:1) — a new
`tests/design-tokens.test.cjs` enforces every text token's contrast on
every run. Every coloured box-shadow glow is gone, replaced by 1px
accent-tinted borders (`Card` `emphasis`) or neutral multi-layer
shadows; the last indigo remnant and the off-token rose tints now match
the tokens. One display face (Syne) and one body face (Inter);
Clash Display and DM Sans no longer load. Dashboard onboarding copy
rewritten in plain words. The resume page tells the two local-audit
causes apart (out of credits vs AI unavailable). `ProgressRing` and
`ScoreBar` clamp their input. The WebGL background was left exactly
as-is — keep-or-remove is still Siva's decision.

**Contrast table** (WCAG, on `--bg-base`; AA bar 4.5:1). Dark: text
16.90:1, secondary 8.38:1, muted 5.30:1, lime 14.67:1, mint 12.74:1,
amber 9.38:1, danger 6.44:1; ink on lime 15.34:1. Light: text 16.64:1,
secondary 7.23:1, muted 5.16:1, lime 4.61:1, mint 4.92:1, amber
5.14:1, danger 5.12:1; white ink on lime 4.97:1.

**Deliberate non-changes.** Body stays 14px (Linear-style dashboard
density) with the master prompt's 1.6 line height. The auth page
keeps its hardcoded dark palette inside its own `<style>` block — it
never follows the light theme; unifying it is a separate job. The
local audit still counts keywords as fully covered when no job
description is given, and says so in the breakdown — the score is
honest about what it did not check.
