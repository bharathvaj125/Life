# Life RPG — Completion Plan (Tech Zephyr 4.0)

Sources: `TZPSv2.pdf` (problem statement) + `WEB HACKATHON.pdf` (rulebook). Round 1 window: 12 Sep 2026 10:00 AM → 13 Sep 2026 10:00 AM IST.

## Where we stand (audited from code, not just the README)

Core RPG systems (auth, CRUD, non-linear leveling, streaks, attributes, economy) are **built and working** — backend has unit tests, both frontend and backend validate edge cases (empty title, 120-char limit, editing a completed task). Confetti, sound, and a celebration modal are already wired in, not just present as dead files. The three things standing between this and a submittable entry are **deployment, accessibility polish, and the deliverables package** (video + commit hygiene) — not core functionality.

---

## Phase 1 — Accessibility & Robustness Hardening
*Maps to: PS §5 "Responsive & Accessible UI", Rulebook "UI/UX Design" (15%), "Robustness & Edge Cases"*

- [ ] Add `aria-live="polite"` to the XP/level-up celebration toast (`CelebrationModal.jsx`) and any shop purchase confirmation — screen reader users currently get nothing when the core "wow" moment fires
- [ ] Add `aria-label`s to icon-only buttons (currently only 3 of 13 component files carry any `aria-*`)
- [ ] Confirm focus management: does closing `CelebrationModal` return focus to the triggering button? Does the auth form show focus outlines?
- [ ] Verify color contrast on the cyberpunk palette (neon-on-dark themes often fail WCAG AA) — check body text, not just accents
- [ ] Simulate a dropped network request (kill the backend mid-session) and confirm the UI fails gracefully instead of white-screening — required by PS §7 judging ("what happens if their internet connection drops?")
- [ ] Confirm the "Fake Data Persistence" disqualification risk is closed: verify the SQLite file actually survives a backend **restart**, not just a frontend refresh

**Commit when done:** `fix(a11y): aria-live announcements, focus handling, contrast pass`

---

## Phase 2 — SEO & Performance Pass
*Maps to: Rulebook "Performance & SEO"*

- [ ] Add Open Graph tags (`og:title`, `og:description`, `og:image`) to `frontend/index.html` — currently only has title/description/viewport
- [ ] Add a proper favicon/OG image (currently inline SVG data URI only)
- [ ] Run a Lighthouse pass once deployed; fix anything under ~85 on Performance/SEO/Accessibility
- [ ] Confirm images (`hero.png`) are optimized/lazy-loaded

**Commit when done:** `feat(seo): meta tags, og image, lighthouse fixes`

---

## Phase 3 — Deployment
*Maps to: PS §4 "Live Deployed URL", Rulebook zero-tolerance "Build/Deployment Failure"*

**Known constraint:** backend uses `better-sqlite3` (native module, local file) — incompatible with Vercel's stateless serverless functions. Decision needed before this phase starts:
- **Option A (recommended, less work):** frontend → Vercel, backend → Railway (persistent volume, SQLite untouched)
- **Option B:** migrate `backend/src/db/index.js` to a hosted Postgres, run both on Vercel
- **Option C:** frontend on Vercel now, backend host decided after

- [ ] Deploy backend first, get its public URL
- [ ] Set backend `CORS_ORIGIN` to the eventual frontend URL
- [ ] Deploy frontend to Vercel with `VITE_API_URL` pointing at the live backend
- [ ] Confirm the deployed backend actually reads/writes its database in production (not just locally) — this is the exact scenario the "Build/Deployment Failure" rule zeroes out
- [ ] Re-run the full flow against the **live** URLs: signup → create quest → complete quest → refresh → data still there

**Commit when done:** `chore(deploy): vercel + backend hosting config`

---

## Phase 4 — Wow / Innovation Layer *(time-permitting, after Phases 1–3 are solid)*

**Are wow features actually needed?** Yes — per PS §7, Design/UX carries a "Crucial Warning" that generic execution loses significant marks, and Rulebook weights Innovation & Creativity + UI/UX at 25% combined. But the checklist items (auth, CRUD, leveling, streaks, attributes, economy, responsive/accessible) are the **floor** — missing any of those risks a zero regardless of how flashy the rest is. So: finish Phases 1–3 first, then spend remaining time here.

Ranked by impact vs. effort, given what's already built:

| Idea | Effort | Why |
|---|---|---|
| Wire `aria-live` celebration announcements (Phase 1) to also *look* better — screen shake / chromatic aberration pulse on level-up | S | Reuses existing `CelebrationModal`, dual-purpose with accessibility work |
| Achievement/badge unlock system | M | Badge UI elements already exist in multiple components — check if they're static decoration or wired to real unlock logic; if static, this is the highest-leverage gap between "looks gamified" and "is gamified" |
| XP boost consumables actually applying an effect | M | Friend's own README lists this as a known gap ("Phase 2" in original notes) |
| Boss-battle framing for streak milestones (3/7/14/30/60/100) instead of a plain counter | S–M | Streak logic already computes milestones server-side; this is presentation only |
| Ambient particle/glitch background reacting to character level or theme | M | Visual differentiator, but purely cosmetic — do last |
| Personal-best stats panel (longest streak, highest single-day XP) | S | Cheap, reuses existing activity log data |

**Do not start this phase until Phases 1–3 are checked off** — a polished-but-broken deploy scores worse than a plain-but-working one.

---

## Phase 5 — Testing & QA Checklist
*Run this after Phase 3 (against the live deployment), and again after Phase 4*

**Functional**
- [ ] Signup → login → logout → login again
- [ ] Create task, edit task, delete task, complete task
- [ ] Complete a task and confirm XP/gold/level/streak math matches `rpgEngine.js`
- [ ] Break a streak deliberately (skip a day) and confirm it resets
- [ ] Buy a shop item with insufficient gold → graceful failure, not a crash
- [ ] Submit an empty-title task → inline error, not a 500

**Cross-cutting (judging-criteria-aligned)**
- [ ] Refresh the page after each action → data persists (proves real DB, not localStorage)
- [ ] Test at 375px (mobile), 768px (tablet), 1440px (desktop) — no horizontal scroll, no clipped text
- [ ] Full keyboard-only pass: Tab through the entire app, complete a task using only Tab/Enter/Space
- [ ] One screen-reader spot check (NVDA or VoiceOver) on the auth form and the level-up celebration
- [ ] Kill the backend mid-session → frontend shows an error state, doesn't white-screen

**Commit when done:** `test: QA pass on live deployment`

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
