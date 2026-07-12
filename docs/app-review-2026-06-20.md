# PawfectPal — Live App Walkthrough

Date: 2026-06-20
Scope: visual/UX/logic review of the deployed app (https://pawfectpal-production-2f07.up.railway.app), excluding the auth flow per request. Read-only — nothing was changed or deleted. Pages covered: Dashboard, Pets, Pet Edit, Tasks, Vaccines, Weight Tracking, My Bookings, Find Providers, Request Board, My Posted Requests, Chat.

No native browser alert()/confirm() popups appeared during normal navigation. They may only show up on destructive actions (e.g. the trash-can icons), which weren't clicked to avoid risking real data — say the word and I'll trigger one and immediately cancel it to check.

---

## What's working well

- Visual design is clean and consistent: MUI components, a clear color language (red = overdue/alert, orange = due soon, blue = info, green = verified/open), readable type, sensible icon use.
- The Breed Information panel on the pet edit page (average weight range, life expectancy, energy/grooming/training characteristics, breed-specific health risks, an automatic "underweight for this breed" warning) is a genuinely strong, differentiated feature.
- "Smart Vaccine Suggestions" tailored to Israeli standards is a nice, localized touch.
- Weight goal tracking with a progress bar toward a target weight is well executed.
- The "Filter Providers by Service Type" control already exists in the Find Providers UI — it's just waiting on the backend filter to actually work (see below, already in progress).
- Across 10 pages, nothing crashed or white-screened, and Hebrew (RTL) content rendered fine inside the LTR app shell with no layout breakage.

---

## Bugs, ranked by impact

### 1. The marketplace and service-request systems don't talk to each other (High)
"My Posted Requests" (`/my-service-requests`) shows 16 of your own posted requests, all status "Open." But "Request Board" (`/marketplace`) — the page providers actually browse — shows **"No posts found"** under All Posts. They're reading from two different backend tables (`service_requests` vs `marketplace_posts`), so nothing a pet owner posts via "My Posted Requests" is ever visible to a provider browsing the board. This is the exact dual-system problem from the prior backend audit, now visibly confirmed live: the core request → provider-discovers-it loop is broken end to end.

*Status: I'm already mid-way through merging these into one system on the backend per your earlier go-ahead. Once that ships, this resolves — but it's broken in production right now.*

### 2. Dashboard overdue-vaccination count is wrong, ~10x inflated (High)
Dashboard says "Overdue Vaccinations (30)." The actual Vaccines page says **Overdue: 3** (and its own math checks out: 3 overdue + 13 due soon + 44 up to date = 60 total, exactly). The "Upcoming (13)" dashboard number does match "Due Soon (13)," so only the overdue count is broken. Worth specifically checking the dashboard's overdue query for a join that's fanning out rows, and double-checking it's scoped to the current user only (the magnitude of the discrepancy is large enough to be worth ruling out a scoping bug, not just an off-by-some-multiplier one).

### 3. Most providers show no services (High)
On Find Providers, 15 of ~19 listed providers have a blank "Services:" line; a few show literal junk text ("nope," "maybe," "idk") instead of a real service type. This is the live symptom of the same provider-profile split the backend audit flagged (also being fixed now) — and the junk values suggest "services" may have been a free-text field at some point rather than constrained to the service catalog.

### 4. Chat thread titles are broken (Medium)
All 17 conversations are titled like `Dog Walking: הליכה עם הכלבים - Provider` — literally ending in the word "Provider" instead of the other party's actual name, on every single thread. Looks like a template variable that isn't being interpolated. Cheap, high-value fix.

### 5. Weight alerts aren't distinguishable from each other (Medium)
The dashboard's Weight Alerts section shows 4 cards, all "Bob — Sudden weight change," word-for-word identical, two styled red and two styled blue. Either it's a genuine duplicate, or these are 4 different historical events that just look identical because the card doesn't show the date or the actual weight change. Recommend adding the date and the before/after weight to each card regardless — and if the backend turns out to be generating true duplicates, dedupe there too.

### 6. Missing translation keys fire on nearly every page (Medium)
Console warnings for `pets.unknownAge` and `pets.futureBirthdate` fired twice per pet on every single page that renders the pet list (12 warnings for 6 pets, consistently), plus `errors.allPets` on several pages. Not visibly breaking anything today, but it means the age-formatting fallback path is running unconditionally for every pet on every render rather than only when there's bad data — that's worth understanding even though it's currently silent. Quick part: add the missing keys to `en.ts`/`he.ts`; worth a broader grep for other `t('...')` calls missing locale entries while in there.

### 7. Pet age value disagrees with itself (Medium)
Bob shows "Age: 8 months" on the Pets list, but the Edit Pet form's Age field shows "12" (hint text says "0–30 years"). Likely the stored `age` integer and the birth-date-derived display age have drifted — worth deciding which is the source of truth when both exist and keeping them in sync.

### 8. Minor text/UI polish (Low)
- Weight cards read "Ideal Weight Range: 8-14 kgincreasing trend" — missing separator between "kg" and the trend label, on every pet's card.
- "Test" (cat) is at 6.01 kg against an ideal range of 3.5–5.5 kg — over its own range — but gets no overweight callout, while Bob correctly got an "underweight for this breed" banner. Worth checking the over-range branch of that warning actually fires.
- "View Details" on a pet card opens the **edit** form (`/pets/{id}/edit`), not a read-only detail view — not wrong, just over-promising; rename or build an actual detail view.
- Provider cards all list "Languages: English, Hebrew" verbatim, even on otherwise-empty test profiles — looks like a hardcoded default rather than real per-provider data.
- The dashboard's 4-column vaccine/weight-alert rows clipped at the right edge in one screenshot at ~1568px width — worth a pass on that grid's responsive breakpoints.

### 9. Test data clutter (housekeeping, not a bug)
Pets named "Test"/"rex," posted requests titled "testtesttest"/"TESTY TEST"/"בדיקה," ~60 seeded vaccine records — fine for your own dev account, but it makes some of the numbers above (totals, view counts) harder to sanity-check at a glance. Worth a cleanup pass once you're closer to launch.

---

## Suggested order of attack

1. **Marketplace/service-request merge** (#1) and **provider profile consolidation** (#3) — already in progress on the backend from the earlier audit follow-up; once deployed, re-check Request Board and Find Providers against this same walkthrough.
2. **Dashboard overdue-vaccination count** (#2) — not yet started; needs its own look at the dashboard summary query.
3. **Chat title interpolation** (#4) — small, isolated frontend fix, good next quick win.
4. **Missing i18n keys** (#6) — mechanical, low-risk, do in one pass across locale files.
5. **Pet age inconsistency** (#7) — needs a decision on source-of-truth before fixing.
6. **Polish pass** (#5, #8) — weight alert detail, text spacing, language defaults, "View Details" labeling.
7. **Test data cleanup** (#9) — whenever convenient, not blocking anything.
