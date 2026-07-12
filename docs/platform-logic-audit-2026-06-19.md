# PawfectPal Platform Logic Audit

Date: 2026-06-19
Scope: read-only review of backend service logic, with marketplace as the
primary focus, per request. No code was changed as part of this audit.

This follows the testing/error-message work (backend edge-case tests,
frontend `api.ts` error handling, missing test dependencies fix).

---

## Marketplace — the main finding

The marketplace/provider system is actually **two parallel, inconsistent
implementations** that grew up side by side:

- **Legacy**: `ProviderORM` (table `providers`) + `provider_reviews.py`
  (routes under `/providers/{id}/reviews`).
- **"Enhanced"**: `ProviderProfileORM` (table `provider_profiles`) +
  `enhanced_provider_profiles.py` (`/provider-profiles/...`) +
  `enhanced_provider_reviews.py` (`/provider-reviews/...`).

Both exist, both are wired into the app, and they don't share data the way
the code assumes they do.

### Concrete bugs this causes

1. **Provider detail page shows blank data.** The provider list endpoint
   (`GET /providers`, used by the marketplace browse page) reads bio,
   hourly rate, rating, and services from `enhanced_provider_profile`
   (`provider.py:73-110`). The single-provider endpoint (`GET
   /providers/{id}`, used by `ProviderProfilePage.tsx` when a user clicks
   into a provider) reads the *same* fields from `provider_profile`
   (`provider.py:16-48`) — the other table. Since the real provider setup
   flow (`ProviderProfileSetupPage.tsx`) only writes to `/provider-profiles/`
   (the enhanced table), every provider's detail page will show empty
   bio/rating/services even though they show up correctly in the list.
   This is a live, user-visible bug, not a hypothetical one.

2. **The legacy review endpoints are broken.** `provider_reviews.py`
   (`/providers/{id}/reviews`) builds a `ProviderReviewORM(... user_id=...)`,
   but the actual model (`app/models/provider_review.py`) has no `user_id`
   column — it has `reviewer_id`, and `service_type` is a required
   (non-nullable) field that this code never sets. Any request that got far
   enough to hit `db.add(review)` would throw. In practice it mostly 404s
   first, because it requires `provider_user.provider_profile` (legacy
   table) to exist with reviews tied to it, and nothing in the current UI
   creates those. The working review system is the other one —
   `enhanced_provider_reviews.py` (`/provider-reviews/...`), which matches
   the model correctly. The legacy file appears to be dead, broken code
   still mounted on the live API.

3. **Frontend has a service file pointed at endpoints that don't exist.**
   `serviceProviderService.ts` calls `PUT /providers/{id}` and `POST
   /providers` to create/update a provider profile. `provider.py` only
   defines `GET` handlers — there is no POST or PUT under `/providers` at
   all. `ServiceProviderService.createProvider` / `.updateProvider` would
   404/405 immediately. (`.getProvider`, which hits bug #1 above, *is*
   actually called, from `ProviderProfilePage.tsx`.)

4. **Dual-write attempt that only half-works.** `PATCH /users/me`
   (`user.py:245-293`) does try to keep the legacy and enhanced profiles in
   sync for a handful of shared fields (bio, hourly_rate, rating, services)
   when both exist. But the real onboarding page never calls this endpoint
   — it talks directly to `/provider-profiles/` — so the sync code rarely
   fires for the data that actually matters, and fields unique to the
   enhanced profile (experience_years, certifications, availability
   windows, insurance info) have no sync path at all.

### Smaller marketplace issues

- **`GET /providers` silently ignores its own filter parameter.** It
  accepts `filter: Optional[List[str]]` and immediately discards it
  (`del filter`). The frontend's `getProvidersByService()` even calls
  `/providers?service_type=X`, but the backend doesn't read `service_type`
  either — so "filter providers by service" does nothing server-side
  today; the full list always comes back.
- **`assign_provider` on a service request has no status guard.** A
  request owner can assign any user with `is_provider=True` to their
  request regardless of whether that provider ever responded to it, and
  regardless of the request's current status (e.g. you can reassign a
  request that's already `in_progress` or `completed` without any check).
- **Marketplace posts and service requests are two separate, largely
  duplicated systems** (`marketplace_posts.py` and `service_requests.py`
  are near-identical in shape: same pet-ownership validation, same
  service-type validation, same provider-availability check, same
  expiry/urgency logic). Right now a "request" posted as a marketplace
  post and a "request" posted as a service request behave almost
  identically but live in separate tables with separate response/assignment
  flows. Worth deciding if these should actually be the same concept.
- **`_ensure_marketplace_available`** (checking `marketplace_posts` /
  `marketplace_post_pets` tables exist before serving most marketplace-post
  endpoints) is a reasonable defensive guard for an in-progress migration,
  but it's a signal the schema/migration state has been a recurring source
  of pain — worth confirming it's no longer needed once migrations are
  fully settled, since it adds a DB introspection query to nearly every
  request.

### What's good here

- Pet-ownership validation before creating a marketplace post or service
  request is correctly scoped to the current user (`PetORM.user_id ==
  current_user.id`) in both `marketplace_posts.py` and
  `service_requests.py`.
- `ServiceMatchingService` is consistent — it only ever reads from the
  enhanced `ProviderProfileORM`, so the matching/availability logic itself
  (used by both posts and requests) is not affected by the dual-table
  problem above.
- Ownership checks on update/delete for posts and requests correctly
  filter by `user_id == current_user.id` at the query level (returning 404
  rather than 403 for someone else's post, which is a reasonable
  information-hiding choice).
- `get_service_request` has sensible visibility rules (owner, assigned
  provider, or any provider when the request is still open).

---

## Other services

### Pets

- **`update_pet` does a full overwrite, not a partial update**, even
  though `PetUpdate` is itself a schema where every field is `Optional`
  (designed to support partial updates). Every field on the pet is
  assigned directly from the request body (`pet.py:117-140`); any field
  omitted from the PUT becomes `None`. Right now this is *not* actively
  biting you, because the only caller in `petService.ts` (`updatePet`)
  always sends a fully-populated object built from the existing pet.
  But it's a landmine: anyone (including future-you) sending a smaller
  payload will silently wipe the rest of the pet's data. Worth comparing
  to how `update_marketplace_post` / `update_service_request` / provider
  profile updates do it — they all use `exclude_unset=True` so unset
  fields are left alone. Pet update is the odd one out.
- **`patchPet` in the frontend is dead and would fail anyway.** It sends
  `PATCH /pets/{id}/`, but `pet.py` has no `@router.patch` — only GET,
  POST, PUT, DELETE. It's unused (no call sites found), so this isn't
  live, but it's a trap if someone wires it up expecting it to work.
- Good: ownership checks (`user_id == current_user.id`) are consistently
  applied on get/update/delete. The auto-recorded weight-history entry on
  weight change (`pet.py:142-153`) is a nice touch that keeps the weight
  chart consistent with profile edits.

### Tasks / Vaccinations

- Ownership checks are correct, including the join-based check for
  vaccinations (scoped through the parent pet). Confirmed by the new edge
  case tests added this round (cross-user access correctly 404s).
- No major issues found in the logic itself.

### Auth

- `get_current_user` and `require_provider` are straightforward and
  correct. `get_current_user_websocket` has a sensible fallback for
  pulling the token out of the WS query string when it isn't passed
  explicitly.
- `toggle_provider_status` is the one place that actually creates the
  legacy `ProviderORM` row when a user flips into provider mode — worth
  knowing this is the only writer of that table, which is part of why the
  legacy/enhanced split above causes the bugs it does.

### Frontend `api.ts` / error handling

- Already addressed this round: status-specific, actionable error
  messages; a real request timeout via `AbortController`; offline vs.
  server-unreachable distinction; safe handling of non-JSON error bodies.
  23 tests now cover this and pass.

### Testing infrastructure (found incidentally, not marketplace-specific)

- `frontend/package.json` was missing `vitest`, `jsdom`,
  `@testing-library/jest-dom`, and `@testing-library/react` from
  `devDependencies` entirely. No frontend test — old or new — could run
  before this was fixed. This has been corrected as part of this round's
  testing work; worth running `npm install` locally to pick it up if you
  haven't already.

---

## Suggested next steps

1. **Decide which provider-profile system is canonical** (almost certainly
   the "enhanced" one — `ProviderProfileORM` / `/provider-profiles/` /
   `/provider-reviews/`, since that's what the real UI talks to) and treat
   the other as legacy to be removed: delete `provider_reviews.py`,
   migrate or drop the `providers` table, and point `GET /providers/{id}`
   at the same `enhanced_provider_profile` data the list endpoint already
   uses. This single change fixes the blank-provider-detail-page bug and
   the dead/broken review endpoints in one pass.
2. **Fix `update_pet` to use `exclude_unset=True`** like the other update
   endpoints in the codebase, so partial updates can't silently null out
   fields. Low risk, high value, since it brings pet updates in line with
   how everything else in the app already does it.
3. **Either implement or remove the `filter`/`service_type` parameter on
   `GET /providers`** — right now it's API surface that looks like it does
   something and doesn't.
4. **Add a status check to `assign_provider`** (e.g. only allow assigning
   when the request is still `open`) to prevent silently reassigning
   in-progress or completed requests.
5. **Revisit whether `marketplace_posts` and `service_requests` should be
   one concept.** They currently duplicate most of their validation and
   lifecycle logic; consolidating (or clearly documenting why they're
   separate) would reduce the surface area for the kind of drift seen in
   the provider-profile split.
6. This audit didn't change anything by design — once you've decided which
   of the above you want to act on, that's a good next task to scope out
   specifically (happy to help fix any of these once you say go).
