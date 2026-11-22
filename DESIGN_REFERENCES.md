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
