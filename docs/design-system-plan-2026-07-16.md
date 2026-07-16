# ADR: Unifying Form/Field Design Across PawfectPal

**Status:** Proposed
**Date:** 2026-07-16
**Deciders:** Bar

## Context

The recurring complaint across this session (Add Vaccine page looking like "an
internal tool," inconsistent form field styling, hardcoded English labels
surfacing in Hebrew pages) isn't really about missing styling — it's about
**uneven adoption** of styling that mostly already exists.

I checked `frontend/src/contexts/ThemeContext.tsx` directly. It already has:
- A real warm palette (primary/secondary/success/warning/info, light+dark mode)
- `shape.borderRadius: 14`
- Component overrides for `MuiButton`, `MuiCard`, `MuiPaper`, `MuiOutlinedInput`,
  `MuiChip`, `MuiDataGrid`

So `TaskForm.tsx` (the "Add Vaccine" page) is *technically* inheriting card
radius, shadow, and rounded text fields already — that's not the gap. The gap is:

1. **No `MuiTextField`/`MuiFormControl`/`MuiSelect`/`MuiCardHeader` defaults.**
   Every page currently sets its own `size`, spacing, and header treatment ad
   hoc. Pages that got a manual design pass (Pets, Dashboard) look polished;
   pages that didn't (`TaskForm`, i.e. Add Task/Add Vaccine) fall back to raw
   MUI defaults and look foreign next to the rest of the app.
2. **No enforcement against hardcoded strings.** `TaskForm.tsx` has vaccine
   field labels ('Vaccine Title', 'Vaccine Details', 'Vaccine Name', 'Dose
   Number', 'Clinic', 'Batch Number', 'Manufacturer') as raw JS string
   literals, never routed through `t()`. This is the same class of bug I fixed
   three separate times this session in three different files
   (`BreedInfoCard.tsx`, `PetCard.tsx`, and the vaccine explainer copy) — it
   keeps recurring because nothing catches it before it ships.
3. **No shared page/section layout primitive.** Pages that "look designed"
   (Pets grid cards) got a bespoke one-off treatment (gradient header strip,
   icons, specific spacing). There's no shared `<FormPageCard>` or
   `<SectionHeader>` component other pages can adopt, so each page reinvents
   its own layout by hand or doesn't bother.

## Decision

Fix (1) and (2) first — they're cheap, low-risk, and touch one file each.
Defer (3) — it's real refactor work and contradicts "simple."

## Options Considered

### Option A: Expand global theme defaults (one file: `ThemeContext.tsx`)
Add `MuiTextField` (`defaultProps: { size: 'small', variant: 'outlined' }`),
`MuiFormControl`, `MuiSelect`, `MuiCardHeader` overrides to the existing
`components` block.

| Dimension | Assessment |
|---|---|
| Complexity | Low — same file already doing this job |
| Blast radius | Every MUI form app-wide, including future ones, for free |
| Risk | Changing a global default (e.g. `size: 'small'`) can shift layouts on pages that assumed the old default — needs a visual pass after, not zero-risk |
| Effort | ~30 min |

**Pros:** Retroactively fixes every existing unstyled page (Add Vaccine included) without touching those files. New pages inherit consistency automatically — nobody has to remember to "style" a new form.
**Cons:** Can't fix content-level issues (hardcoded strings, missing icons/visual hierarchy, missing Card wrapper on pages that don't have one at all). Global default changes need a quick visual sanity pass across the app's other forms afterward, since MUI defaults cascade everywhere including places I haven't screenshotted.

### Option B: Shared layout components (`<FormPageCard>`, `<SectionHeader>`)
Build 1-2 reusable wrapper components and retrofit pages to use them.

| Dimension | Assessment |
|---|---|
| Complexity | Medium-High |
| Blast radius | Only pages explicitly migrated |
| Risk | Touches page structure/JSX per file — same truncation/regression risk class we've been actively fighting all session |
| Effort | Hours, one page at a time, each needing its own diff-verify-tsc cycle |

**Pros:** Actually gets pages like Add Vaccine visually to Pets-page quality (icons, color, hierarchy) — Option A can't do this.
**Cons:** This is a real refactor, not a "simple" fix. Contradicts the brief. Should be a separate, later initiative — done incrementally like everything else this session, not in one batch.

### Option C: i18n coverage guard (prevent future hardcoded strings)
A lightweight script (grep-based, not a full custom ESLint rule) that flags
JSX text/label content that looks like an untranslated literal, run manually
before a commit — not full CI infrastructure, just a repeatable check.

| Dimension | Assessment |
|---|---|
| Complexity | Low |
| Coverage | Catches the obvious cases (quoted English inside `label=`, `<Typography>`), will have false positives/negatives — not a substitute for a real i18n lint plugin |
| Effort | ~20 min |

**Pros:** Directly targets the bug class that's recurred three times this session already.
**Cons:** A grep heuristic isn't as reliable as a proper `eslint-plugin-i18next`-style rule — that's a bigger dependency/setup decision I'm deliberately not making unilaterally here.

## Trade-off Analysis

Option A gets the most visual consistency for the least risk and is reversible
(it's one file). Option B is the "real" fix for pages like Add Vaccine looking
foreign, but it's not simple, and this session has already hit real regressions
from doing too much in one batch (the NTFS-mount truncation bug hit three
files earlier tonight) — more surface area per change means more chances to
break something silently. Option C is cheap insurance against the exact bug
you've now reported in three different components.

**Challenging my own recommendation:** it's tempting to just say "do Option A,
it's easy" — but Option A alone will *not* make Add Vaccine look like the Pets
page. It'll get rounded fields and consistent card padding, and the English
labels will still be there, and it'll still lack any color/icon treatment. If
"unified design" means "Add Vaccine should look designed," that's Option B,
not A — I don't want to claim a one-file theme tweak solves a problem that
actually needs per-page work. The honest scope split is: A+C get you
*consistency* cheaply; B gets you *polish*, expensively, one page at a time.

## Recommendation (phased)

1. **Now (low-risk, do first):** Option A — extend `ThemeContext.tsx` component
   overrides (TextField/FormControl/Select/CardHeader defaults). One file,
   fully reversible, immediate app-wide effect.
2. **Right after:** Option C — a `scripts/check-hardcoded-strings.py` (or
   similar) grep pass across `frontend/src`, run once now to find every
   remaining offender (not just the ones you've screenshotted), fixed in one
   batch like the locale fixes tonight.
3. **Separate, later, one page at a time:** Option B for the pages that
   actually need visual polish beyond consistency — Add Vaccine/Task form is
   the clear first candidate given it's the one you've flagged twice.
4. **Explicitly out of scope here:** the `theme.direction: 'rtl'` +
   stylis-rtl structural fix flagged earlier this session. It's related
   (RTL bidi bugs are a form of "design inconsistency") but it's a distinct,
   higher-risk architectural change that deserves its own dedicated
   pass and QA, not a rider on this ticket.

## Consequences

- Easier: any new form/page automatically looks consistent with the rest of
  the app without a manual design pass.
- Still hard: pages needing actual visual hierarchy (icons, color, layout)
  won't get it from step 1 alone — that's explicitly deferred to step 3.
- Needs revisiting: after step 1 ships, a quick visual pass across existing
  forms (Settings, Marketplace, Services) to make sure the new global
  defaults didn't shift anything unexpectedly.

## Action Items

1. [ ] Extend `ThemeContext.tsx`: `MuiTextField`, `MuiFormControl`, `MuiSelect`,
      `MuiCardHeader` defaults/overrides
2. [ ] Grep-audit `frontend/src` for hardcoded English strings in
      label/Typography/Chip content, fix what's found
3. [ ] Visual pass across Settings/Marketplace/Services/Pets after step 1 to
      catch any layout shift from the new defaults
4. [ ] (Separate task, later) Retrofit Add Vaccine/Task form with a proper
      visual treatment matching the Pets page quality bar
