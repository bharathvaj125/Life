# Life RPG ⚔️ — Turn your to-do list into a role-playing game

A full-stack Life RPG web app built for **Tech Zephyr 4.0 (IIT Bhubaneswar)**. Complete real-world
tasks ("Missions") to earn XP, level up, build streaks, and spend Credits in a cyberpunk-themed
Black Market — all backed by a real database, not `localStorage`.

See [`PLAN.md`](./PLAN.md) for the phased completion plan against the problem statement and
hackathon rulebook.

## Stack

- **Frontend**: React 19 + Vite, Tailwind CSS, Framer Motion, `canvas-confetti`, `html-to-image`
  (Operative Card PNG export) — cyberpunk "Command Terminal" theme
- **Backend**: Node.js (ESM) + Express 4, JWT + bcrypt auth, per-user data isolation, rate limiting
- **Database**: PostgreSQL via Supabase (accessed with `pg`; every query goes through
  `backend/src/db/index.js`, a thin async adapter kept close to the shape of a prepared-statement
  API so route code stays simple)

## Disclosure

Per the hackathon rulebook's requirement to disclose third-party libraries, frameworks, and AI
tools: this project was built with AI pair-programming assistance (Claude Code) alongside manual
development and review. Every third-party package in use is listed above and in
`backend/package.json` / `frontend/package.json`; no UI templates or boilerplate beyond Vite's
standard React scaffold were used.

## Core systems

- 🔐 **Auth**: signup/login with bcrypt password hashing + JWT sessions
- 🗄️ **Database schema**: Users, Tasks, Attributes, Activity Log, Shop Items, Inventory
- ⚔️ **RPG Progression Engine**: non-linear XP curve, per-attribute leveling, streaks with
  milestone bonuses, difficulty-scaled rewards
- 💰 **Economy**: Credit-based shop with purchase + equip endpoints
- 🛡️ **Security**: per-user data isolation (all queries scoped by `user_id` from the JWT),
  rate limiting on auth and API routes, input validation
- ♿ **Accessibility**: labelled form fields, live-region announcements on level-up/streak
  celebrations and status/error banners, keyboard-reachable controls, responsive down to 375px

## Project structure

```
life-rpg/
├── backend/
│   ├── src/
│   │   ├── db/            # Postgres connection + schema (auto-migrates on boot), seed script
│   │   ├── middleware/     # JWT verification
│   │   ├── routes/         # auth, tasks, character, shop
│   │   ├── utils/          # rpgEngine.js — leveling curve, streak logic, difficulty rewards
│   │   ├── app.js           # Express app (shared by the local dev server)
│   │   └── server.js        # local dev entrypoint (`node src/server.js`)
│   ├── tests/               # unit tests for the RPG engine
│   ├── .env.example
│   └── vercel.json           # deploys src/server.js directly as a Vercel service
├── frontend/
│   ├── src/
│   │   ├── components/     # layout, character, missions, shop, fx (celebration modal), ui
│   │   ├── context/         # AuthContext, GameContext
│   │   ├── lib/              # api client, sound effects
│   │   └── pages/            # AuthPage
│   └── .env.example
└── PLAN.md
```

## Local setup

**Backend** (http://localhost:4000):

```bash
cd backend
cp .env.example .env      # set DATABASE_URL to a Postgres instance (e.g. a Supabase project) and a real JWT_SECRET
npm install
npm run dev                 # or `npm start` for a non-watching run — auto-seeds the shop and migrates the schema on boot
```

`GET /api/health` confirms it's alive. `npm test` runs the RPG engine unit tests.

**Frontend** (http://localhost:5173):

```bash
cd frontend
cp .env.example .env      # set VITE_API_URL to your backend URL (e.g. http://localhost:4000)
npm install
npm run dev
```

## Environment variables

**`backend/.env.example`**

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default `4000`) |
| `JWT_SECRET` | Secret used to sign session tokens — **must** be changed for production |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |
| `DATABASE_URL` | Postgres connection string (a Supabase project's pooled connection URI works well) |

**`frontend/.env.example`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the deployed backend API |

## API reference

### Auth
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/signup` | `{ username, email, password }` | Creates user + 4 default attributes (Intellect, Strength, Discipline, Creativity) |
| POST | `/api/auth/login` | `{ emailOrUsername, password }` | Returns `{ token, user }` |

### Character (requires `Authorization: Bearer <token>`)
| Method | Route | Notes |
|---|---|---|
| GET | `/api/character/me` | Full profile + computed level state + attributes |
| GET | `/api/character/activity` | Last 50 activity log entries |
| PATCH | `/api/character/theme` | `{ theme }` — one of `knight, mage, cyberpunk, cozy, ranger` |

### Tasks (Missions)
| Method | Route | Notes |
|---|---|---|
| GET | `/api/tasks?status=active\|completed\|archived` | List the user's own tasks only |
| POST | `/api/tasks` | `{ title, description?, attribute?, difficulty?, due_date? }` |
| PATCH | `/api/tasks/:id` | Edit an active (not-yet-completed) task |
| DELETE | `/api/tasks/:id` | Remove a task |
| POST | `/api/tasks/:id/complete` | **The core RPG trigger.** Grants XP/credits, updates streak, levels up attributes and character, returns a full diff payload for celebratory UI |

### Shop
| Method | Route | Notes |
|---|---|---|
| GET | `/api/shop/items` | All items, flagged with `owned` |
| GET | `/api/shop/inventory` | The user's owned items |
| POST | `/api/shop/buy/:itemId` | Deducts credits, fails gracefully if insufficient |
| PATCH | `/api/shop/equip/:itemId` | Equips an owned item (unequips others in its category) |

## RPG Progression Engine design

- **Non-linear leveling**: XP required for level *N* is `floor(25 * N^1.5)`, so level 2 needs
  25 XP, level 10 needs ~790 XP, level 30 needs ~4100 XP — early progress feels fast, later
  levels are a real commitment.
- **Difficulty-scaled rewards**: `trivial → epic` tasks award 5–60 XP and 2–35 credits.
- **Streaks**: comparing `last_active_date` to today/yesterday; a gap of more than one day
  resets the streak. Milestone streaks (3/7/14/30/60/100 days) award bonus credits.
- **Attributes** level up independently using the same curve, so a user can be "Level 12
  Overall" but "Level 20 Intellect" if they've been reading a lot.

All of this logic lives in `backend/src/utils/rpgEngine.js` as pure functions, unit-tested in
isolation from Express/Postgres (`backend/tests/rpgEngine.test.js`).

## Deployment

Both frontend and backend run on Vercel, with Supabase as the database — everything on free
tiers, no paid plan required:

- **Frontend**: `frontend/` deployed to Vercel with zero-config Vite detection (build `vite build`,
  output `dist`). `VITE_API_URL` points at the backend's URL.
- **Backend**: `backend/` deployed to Vercel as a native Node.js **service** (Vercel detects the
  Express app and runs `src/server.js` directly per `backend/vercel.json` — not the older
  per-request serverless-function model, so no cold-start-per-route wrapper is needed). `CORS_ORIGIN`
  points at the frontend's URL, `DATABASE_URL` points at the Supabase project.
- **Database**: a free Supabase Postgres project. Schema creation and shop seeding both run
  automatically on boot (`initSchema()` / `ensureShopSeeded()` in `backend/src/app.js`), so a
  fresh Supabase project needs zero manual setup.
  ⚠️ Supabase's free tier pauses a project after **7 days with no API activity** — visiting the
  live app periodically (daily is comfortably enough) keeps it from pausing.

## Live deployment

- **App:** https://life-rpg-frontend-two.vercel.app
- **API:** https://life-rpg-backend-navy.vercel.app

## Status

Core RPG systems (auth, CRUD, non-linear leveling, streaks, attributes, economy), theming,
accessibility/robustness hardening, and a real achievement system are complete, tested, and
verified live end-to-end (signup → create/complete a mission → level up → refresh → data
persists) — on the current Vercel + Supabase stack specifically, after migrating off an earlier
Railway + SQLite deployment to remove any trial-expiry risk before judging. Remaining item — the
walkthrough video — is tracked in [`PLAN.md`](./PLAN.md).
