# Fedivan

A TweetDeck-style unified feed viewer that combines **Bluesky** and **Mastodon** into one merged timeline, with an **X (Twitter) List** shown as a separate embedded column.

## Quick start

```bash
cp env.example .env        # edit values (see below)
npm install
npm run dev                 # starts backend + frontend concurrently
```

The frontend opens at `http://localhost:5173`, the backend API at `http://localhost:3001`.

## Configuration (.env)

| Variable         | Default                   | Description                         |
| ---------------- | ------------------------- | ----------------------------------- |
| `PORT`           | `3001`                    | Backend HTTP port                   |
| `SESSION_SECRET`  | `change-me-to-a-random-string` | Cookie signing secret          |
| `FRONTEND_URL`   | `http://localhost:5173`   | Where the frontend is served        |
| `DB_PATH`        | `./fedivan.db`            | SQLite database file path           |

## Connecting platforms

### Bluesky

1. Go to [bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords) and create an **App Password**.
2. In Fedivan, click **Settings** → enter your handle (e.g. `you.bsky.social`) and the app password.
3. That's it — your home timeline will appear in the Merged column.

### Mastodon

1. Click **Settings** → enter your instance URL (e.g. `mastodon.social`).
2. You'll be redirected to your instance to authorize Fedivan (read-only access).
3. After approving, you're redirected back. Mastodon posts now appear in the Merged column interleaved with Bluesky.

No manual app registration needed — Fedivan registers itself dynamically with your instance.

### X (Twitter)

No API key required. Instead:

1. On X, create a public **List** containing the accounts you want to follow.
2. Copy the List URL (e.g. `https://x.com/i/lists/123456789`).
3. In Fedivan, click **Settings** → paste the List URL.
4. The X column embeds the List's public timeline using X's official widget.

> **Note:** X embeds have been unreliable since 2023 — they may appear blank for logged-out browsers. If that happens, Fedivan shows a fallback card linking to the List on x.com.

## Architecture

```
fedivan/
├── shared/          # TypeScript types shared between frontend and backend
├── backend/         # Express + better-sqlite3 (dev: tsx watch)
│   └── src/
│       ├── platforms/   # Bluesky (@atproto/api), Mastodon (fetch + OAuth2)
│       └── routes/      # /api/auth/*, /api/timeline, /api/status
└── frontend/        # Vite + React 18 + Tailwind CSS v4
    └── src/
        └── components/  # Deck, MergedColumn, PostCard, XColumn, ConnectPanel
```

- **Tokens are server-side only** — the frontend never sees API credentials.
- **SQLite** stores connected accounts so they survive backend restarts.
- The frontend polls `/api/timeline` every 90 seconds (with a 60s server-side cache per platform).

## License

MIT
