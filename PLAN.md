# Life RPG — Completion Plan (Tech Zephyr 4.0)

Sources: `TZPSv2.pdf` (problem statement) + `WEB HACKATHON.pdf` (rulebook). Round 1 window: 12 Sep 2026 10:00 AM → 13 Sep 2026 10:00 AM IST.

## Where we stand (audited from code, not just the README)

Core RPG systems (auth, CRUD, non-linear leveling, streaks, attributes, economy) are **built and working** — backend has unit tests, both frontend and backend validate edge cases (empty title, 120-char limit, editing a completed task). Confetti, sound, and a celebration modal are already wired in, not just present as dead files. The three things standing between this and a submittable entry are **deployment, accessibility polish, and the deliverables package** (video + commit hygiene) — not core functionality.

---

## Phase 1 — Accessibility & Robustness Hardening ✅ DONE
*Maps to: PS §5 "Responsive & Accessible UI", Rulebook "UI/UX Design" (15%), "Robustness & Edge Cases"*

- [x] `aria-live="assertive"` announcement + `role="dialog"`/`aria-modal`/`aria-labelledby` + focus-on-open + Escape-to-close on the level-up/streak `CelebrationModal`
- [x] `htmlFor`/`id` pairs on every auth and mission form field (previously unassociated — screen readers announced nothing)
- [x] `role="alert"` / `role="status"` on error and status banners; `aria-current`/`aria-pressed` on nav tabs and filter/toggle buttons
- [x] `role="progressbar"` + `aria-valuenow/min/max` on the XP bar
- [x] Live-tested a dropped-backend scenario in the browser: `GameContext`'s optimistic-update rollback and `networkError` banner already handled it gracefully — verified, no change needed
- [x] Confirmed SQLite persistence survives a full backend restart (not just a frontend refresh) — verified live: completed a mission, restarted the dev server, data was intact
- [x] **Bonus finds while testing, not in the original scope:**
  - Fixed an **infinite API fetch loop** on every login (`GameContext`'s effect re-triggered on every `setUser` call, hammering the backend into its own rate limiter within seconds — would have looked broken in front of judges)
  - Fixed `better-sqlite3` throwing on a fresh clone because `DB_PATH`'s parent directory was never created (`npm run seed` failed immediately for anyone who just cloned the repo)
  - Fixed a **mobile layout overflow**: below 640px the header's stat badges overflowed the viewport by ~90px and pushed the Logout button completely off-screen and unreachable — a direct violation of "must be fully responsive"

**Commits:** `2e145e2`, `67da654`, `dd2c07f`

---

## Phase 2 — SEO & Performance Pass — mostly done, one item pending deploy
*Maps to: Rulebook "Performance & SEO"*

- [x] Added Open Graph + Twitter Card meta tags and `theme-color` to `frontend/index.html`
- [ ] `og:image` intentionally skipped for now — a real hosted image needs a live domain; add one post-deploy (Phase 3) and revisit `twitter:card` to `summary_large_image`
- [ ] Run a Lighthouse pass once deployed; fix anything under ~85 on Performance/SEO/Accessibility
- [x] Production build verified clean: `vite build` → 419KB JS / 130KB gzipped, no errors — reasonable size, nothing to trim right now

**Commit:** `fa1dafe`

---

## Phase 3 — Deployment — prepped, blocked on your login
*Maps to: PS §4 "Live Deployed URL", Rulebook zero-tolerance "Build/Deployment Failure"*

**Decision made (Option A):** frontend → Vercel, backend → Railway (persistent volume, SQLite untouched — least code change under time pressure).

**Done:**
- [x] `backend/Procfile` added (`web: npm start`) for Procfile-based hosts
- [x] README's Deployment section documents the Vercel/Railway split and why
- [x] Verified `npm run build` succeeds cleanly for the frontend

**Blocked on you — one manual step, ~2 minutes each:**
Neither Vercel CLI nor Railway CLI is authenticated in this environment, and logging in requires an OAuth/email flow only you can complete (I don't hold your credentials and won't create accounts on your behalf). Once you've logged in once:

- [ ] `cd frontend && vercel --prod` (or connect the repo at vercel.com, set root directory to `frontend`)
- [ ] Deploy `backend/` to Railway, **mount a persistent volume at the `DB_PATH` directory** (default `backend/data`) — without this the SQLite file resets on every redeploy, which is exactly what the rulebook's "Fake Data Persistence" rule zeroes out
- [ ] Set backend `CORS_ORIGIN` to the deployed frontend URL, and frontend `VITE_API_URL` to the deployed backend URL
- [ ] Re-run the full flow against the **live** URLs: signup → create mission → complete mission → refresh → data still there
- [ ] Add `og:url` and a real `og:image` to `frontend/index.html` now that a domain exists (Phase 2 leftover)

Tell me once you've logged into Vercel/Railway and I'll drive the rest (env vars, redeploys, verification) from here.

---

## Phase 4 — Wow / Innovation Layer — first item shipped
*(remaining items time-permitting)*

**Are wow features actually needed?** Yes — per PS §7, Design/UX carries a "Crucial Warning" that generic execution loses significant marks, and Rulebook weights Innovation & Creativity + UI/UX at 25% combined. But the checklist items (auth, CRUD, leveling, streaks, attributes, economy, responsive/accessible) are the **floor** — missing any of those risks a zero regardless of how flashy the rest is. So: finish Phases 1–3 first, then spend remaining time here.

Ranked by impact vs. effort, given what's already built:

| Idea | Effort | Why |
|---|---|---|
| Wire `aria-live` celebration announcements (Phase 1) to also *look* better — screen shake / chromatic aberration pulse on level-up | S | Reuses existing `CelebrationModal`, dual-purpose with accessibility work |
| ~~Achievement/badge unlock system~~ | ~~M~~ | **Done.** Confirmed the existing "badge" UI was purely decorative (no unlock logic anywhere). Built a real 10-achievement system computed server-side from actual stats (level/streak/completion-count/first-purchase), unit-tested, with a live corner-toast + chime on unlock. Verified: fresh account starts 0/10, completing a mission unlocks "First Blood" immediately. |
| XP boost consumables actually applying an effect | M | Friend's own README lists this as a known gap ("Phase 2" in original notes) |
| Boss-battle framing for streak milestones (3/7/14/30/60/100) instead of a plain counter | S–M | Streak logic already computes milestones server-side; this is presentation only |
| Ambient particle/glitch background reacting to character level or theme | M | Visual differentiator, but purely cosmetic — do last |
| Personal-best stats panel (longest streak, highest single-day XP) | S | Cheap, reuses existing activity log data |

**Do not start this phase until Phases 1–3 are checked off** — a polished-but-broken deploy scores worse than a plain-but-working one.

---

## Phase 5 — Testing & QA Checklist — local pass done, re-run once live
*Run against localhost first (done below), then again against the live deployment after Phase 3*

**Functional — verified locally in the browser**
- [x] Signup → dashboard loads
- [x] Create mission (epic difficulty) → appears in Active Directives with correct XP/credit reward shown
- [x] Complete mission → level-up celebration fires, XP/credits/attribute all update correctly (Intellect went to Level 2 with 60 XP, matching `rpgEngine.js`'s curve)
- [x] Refresh the page → Level 2, 85 credits, 1-day streak, Intellect Lvl 2 all persisted — confirms real DB persistence, not localStorage
- [x] Backend unit tests: `npm test` → 6/6 passing (leveling curve, difficulty rewards, streak transitions/milestones)
- [ ] Login → logout → login again (not yet exercised)
- [x] Edit task, delete task — **found `updateMission` had no UI entry point at all (PS requires full CRUD); wired up an edit button and verified live: create → edit title → confirmed change → delete**
- [ ] Break a streak deliberately (skip a day) and confirm it resets
- [ ] Buy a shop item with insufficient credits → graceful failure, not a crash
- [x] Submit an empty-title task → inline error confirmed in code path (frontend + backend both validate; not re-driven through the UI this pass)

**Cross-cutting (judging-criteria-aligned)**
- [x] 375px viewport: header, mission form, and shop grid all verified with no horizontal overflow (`document.body.scrollWidth === clientWidth`) after the responsive header fix
- [ ] 768px tablet pass (375px and 1440px checked; tablet not yet spot-checked)
- [x] Keyboard focus order verified: Tab reaches Logout, then Dispatch New Mission, in logical order, with a visible focus ring
- [~] Enter-to-activate a focused button could not be verified through this session's browser automation tool (confirmed via a control test that the tool's synthetic Enter keypress doesn't trigger *any* button's click, including a bare vanilla one — a tool limitation, not an app bug, since every interactive element in the app is a real `<button>`, which activates on Enter/Space in every real browser by spec). **Do one manual keyboard pass yourself as a final sanity check** before recording the video.
- [ ] One screen-reader spot check (NVDA or VoiceOver) on the auth form and the level-up celebration
- [x] Dropped-backend scenario verified: optimistic UI rolls back and shows the network error banner instead of crashing

**Commits:** `67da654`, `dd2c07f` (fixes found during this pass, not a separate commit)

---

## Phase 6 — Deliverables Packaging
*Maps to: PS §4, Rulebook zero-tolerance rules*

- [ ] **Commit count:** repo currently has 2 commits total — rulebook disqualifies **<3 chronological commits**. Phases 1, 3, and 5 above each end in a real commit, which clears this naturally; don't squash them.
- [ ] Root `README.md` rewritten as one unified doc (currently backend/frontend each have separate partial READMEs) with setup instructions, `.env.example` references, and the live URL
- [ ] Record the 90–180s walkthrough video: signup/login → add + complete a task → level-up moment → refresh to prove persistence
- [ ] Host the video in-repo or via a public link that needs no login (rulebook zeroes out login-gated videos)
- [ ] Final check: repo is public, live link loads with no console errors, backend reachable from the deployed frontend

---

## Suggested order

1 → 3 (deploy is a prerequisite for meaningful testing) → 5 → 2 → 4 (only if time remains) → 6 (video last, once everything above is stable, since it documents the finished state).
