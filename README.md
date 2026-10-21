# Mise 🍳

A household meal planning PWA built with Nuxt 3, Firebase, and Tailwind CSS.

## Stack

| Layer | Tech |
|---|---|
| Framework | Nuxt 3 (SSR + PWA) |
| Auth | Firebase Auth (email/password + Google) |
| Database | Firestore (real-time household sync) |
| State | Pinia |
| Styles | Tailwind CSS |
| Recipe import | Nuxt server route + JSON-LD parsing |

## Features (Phase 1 + 2)

- **Auth** — email/password and Google sign-in
- **Household** — create or join via 6-character invite code
- **Recipe Rolodex** — manual entry, tag filtering, full-text search
- **URL Import** — paste a recipe URL, JSON-LD is parsed server-side (no CORS)
- **Weekly Planner** — Mon–Sun × Breakfast/Lunch/Dinner grid, real-time sync
- **Shopping List** — auto-generated from planned recipes, grouped by category, clipboard export

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google providers)
3. Create a **Firestore** database in production mode
4. Register a **Web app** and copy the config

### 3. Environment variables

```bash
cp .env.example .env
# Fill in your Firebase values in .env
```

### 4. Deploy Firestore rules and indexes

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run dev server

```bash
npm run dev
```

### 6. PWA icons

Generate `public/icons/icon-192.png` and `public/icons/icon-512.png` from `public/icons/icon-192.svg`. Any favicon generator works.

## Project structure

```
├── assets/css/          # Global Tailwind CSS
├── components/
│   ├── planner/         # SlotCell, SlotModal
│   ├── recipes/         # RecipeCard, RecipeForm, ImportUrlModal
│   └── ui/              # (reserved for shared UI primitives)
├── composables/
│   ├── useAuth.ts
│   ├── useFirebase.ts
│   ├── useHousehold.ts
│   └── useShoppingList.ts
├── layouts/
│   ├── default.vue      # App shell with top/bottom nav
│   └── auth.vue         # Bare layout for login/register
├── middleware/
│   └── auth.ts          # Route guard
├── pages/
│   ├── auth/            # login, register
│   ├── household/       # setup (create/join)
│   ├── planner/         # weekly planner grid
│   ├── recipes/         # rolodex
│   └── shopping/        # shopping list
├── plugins/
│   └── firebase.client.ts
├── server/api/
│   └── import-recipe.post.ts   # URL scraping + JSON-LD parse
├── stores/
│   ├── auth.ts
│   ├── planner.ts
│   └── recipes.ts
├── types/
│   └── index.ts         # All shared TypeScript types
├── firestore.rules
├── firestore.indexes.json
└── nuxt.config.ts
```

## Coop at Home

Mise can fill your Coop cart from the shopping list ("Send to Coop"). It never checks out: you review the cart and pay (TWINT) on coop.ch.

1. `npm run coop:chrome` opens a dedicated Chrome (remote debugging on `127.0.0.1:9222`). Log in to coop.ch there once and leave it running.
2. In the app: Shopping → Send to Coop → check German search terms → review products and packs → add.
3. "📌 Always buy this" remembers a product per ingredient for the household (`households/{id}/skuPrefs`; deploy the updated `firestore.rules`).
4. Optional `ANTHROPIC_API_KEY` in `.env` auto-translates ingredient names to German search terms (Coop's search is German).

Same service as an MCP server for Claude Desktop / Claude Code (stdio): `npm run coop:mcp`.
Tools: `coop_status`, `coop_search`, `coop_plan` (dry run), `coop_add_to_cart`, `coop_pin`, `coop_list_pins`.
```json
{ "mcpServers": { "coop": { "command": "npx", "args": ["tsx", "coop/mcp.ts"], "cwd": "/path/to/Preppal_Mise" } } }
```
The MCP server keeps its pins in `coop-pins.json`; the app keeps them in Firestore.

`npm run coop:test` runs the matcher tests, `npm run coop:typecheck` typechecks `coop/`.

## Planned

- Meal suggestions filtered by tags / available ingredients
