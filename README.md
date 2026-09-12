# Life RPG ⚔️ — Turn your to-do list into a role-playing game

> **Status: Phase 1 of 4 — Backend Foundation**
> This delivery contains the full backend API. The frontend arrives in Phase 3, with final
> polish and deployment configs in Phase 4.

## What's in this phase

A complete, secure, production-shaped REST API built with **Node.js + Express + SQLite**
(via `better-sqlite3`). It implements every backend requirement from the spec:

- 🔐 **Auth**: signup/login with bcrypt password hashing + JWT sessions
- 🗄️ **Database schema**: Users, Tasks, Attributes, Activity Log, Shop Items, Inventory
- ⚔️ **RPG Progression Engine**: non-linear XP curve, per-attribute leveling, streaks with
  milestone bonuses, difficulty-scaled rewards
- 💰 **Economy**: gold-based shop with purchase + equip endpoints
- 🛡️ **Security**: per-user data isolation (all queries scoped by `user_id` from the JWT),
  rate limiting on auth and API routes, input validation, no plaintext secrets in code

## Tech stack (this phase)

- **Runtime**: Node.js (ESM)
- **Framework**: Express 4
- **Database**: SQLite via `better-sqlite3` (file-based, zero external services required —
  swappable for Postgres later without touching route logic since all access goes through
  `src/db/index.js`)
- **Auth**: `jsonwebtoken` + `bcryptjs`
- **Safety**: `express-rate-limit`, manual security headers

## Project structure

```
life-rpg/
└── backend/
    ├── src/
    │   ├── db/
    │   │   ├── index.js        # SQLite connection + schema (auto-migrates on boot)
    │   │   └── seed.js         # Seeds the shop with starter items
    │   ├── middleware/
    │   │   └── auth.js         # JWT verification middleware
    │   ├── routes/
    │   │   ├── auth.js         # POST /signup, /login
    │   │   ├── tasks.js        # CRUD + POST /:id/complete (the RPG engine trigger)
    │   │   ├── character.js    # GET /me, GET /activity, PATCH /theme
    │   │   └── shop.js         # GET /items, /inventory, POST /buy, PATCH /equip
    │   ├── utils/
    │   │   └── rpgEngine.js    # Leveling curve, streak logic, difficulty rewards
    │   └── server.js           # App entrypoint
    ├── .env.example
    └── package.json
```

## Setup

```bash
cd backend
cp .env.example .env      # edit JWT_SECRET before deploying anywhere real
npm install
npm run seed               # populates the shop with starter items
npm start                  # or `npm run dev` for auto-restart on changes
```

The API boots on `http://localhost:4000` by default. `GET /api/health` confirms it's alive.

## Environment variables (`.env.example`)

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default `4000`) |
| `JWT_SECRET` | Secret used to sign session tokens — **must** be changed for production |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |
| `DB_PATH` | Path to the SQLite database file |

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

### Tasks (Quests)
| Method | Route | Notes |
|---|---|---|
| GET | `/api/tasks?status=active\|completed\|archived` | List the user's own tasks only |
| POST | `/api/tasks` | `{ title, description?, attribute?, difficulty?, due_date? }` |
| PATCH | `/api/tasks/:id` | Edit an active (not-yet-completed) task |
| DELETE | `/api/tasks/:id` | Remove a task |
| POST | `/api/tasks/:id/complete` | **The core RPG trigger.** Grants XP/gold, updates streak, levels up attributes and character, returns a full diff payload for celebratory UI |

### Shop
| Method | Route | Notes |
|---|---|---|
| GET | `/api/shop/items` | All items, flagged with `owned` |
| GET | `/api/shop/inventory` | The user's owned items |
| POST | `/api/shop/buy/:itemId` | Deducts gold, fails gracefully if insufficient |
| PATCH | `/api/shop/equip/:itemId` | Equips an owned item (unequips others in its category) |

## RPG Progression Engine design

- **Non-linear leveling**: XP required for level *N* is `floor(25 * N^1.5)`, so level 2 needs
  25 XP, level 10 needs ~790 XP, level 30 needs ~4100 XP — early progress feels fast, later
  levels are a real commitment.
- **Difficulty-scaled rewards**: `trivial → epic` tasks award 5–60 XP and 2–35 gold.
- **Streaks**: comparing `last_active_date` to today/yesterday; a gap of more than one day
  resets the streak. Milestone streaks (3/7/14/30/60/100 days) award bonus gold.
- **Attributes** level up independently using the same curve, so a user can be "Level 12
  Overall" but "Level 20 Intellect" if they've been reading a lot.

All of this logic lives in `src/utils/rpgEngine.js` as pure functions, unit-testable in
isolation from Express/SQLite.

## Verified working

The full flow (signup → create quest → complete quest → XP/gold/streak update → shop
purchase) was smoke-tested end-to-end against a live local instance before packaging.

## What's next

- **Phase 2**: Deepen the gamification layer (badges, richer streak recovery, XP boost
  consumables actually applying) and add automated tests.
- **Phase 3**: React + Tailwind + Framer Motion frontend with a chosen theme, optimistic UI,
  and loading skeletons.
- **Phase 4**: Accessibility pass, responsive polish, deployment configs (Docker/Render/
  Vercel), the illustration video, and final packaging.
