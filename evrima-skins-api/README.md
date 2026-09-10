# FOGGY Evrima Skin API v0.9.0

Railway backend for the FOGGY Evrima Skin Studio.

## Responsibilities

- Steam OpenID identity and signed website sessions.
- Short-lived per-player skin apply queue.
- Authenticated Windows bridge heartbeat / command / acknowledgement / result endpoints.
- Strict read-only streamed/cache-backed delivery for public IslePilot skinviewer assets used by the browser 3D preview.

The asset service exists because the IslePilot skinviewer CDN does not send browser CORS headers. It is allowlisted to `https://islepilot.eu/cdn/skinviewer/` and only permits `.glb`, `.png`, and `.webp` assets. It is not a general-purpose URL proxy.

On a cache miss, v0.7.0 downloads one upstream asset at a time into Railway's ephemeral `/tmp` storage, writes to `.part`, atomically renames after success, and deduplicates simultaneous requests for the same file. It has no fixed total-download timeout; only 30 seconds of upstream inactivity is treated as a stall. Browser responses are cacheable for seven days.

## Railway root

Deploy this folder as the Railway service root:

```text
/evrima-skins-api
```

## Required variables

- `PUBLIC_BASE_URL` — Railway public HTTPS URL for this service
- `FRONTEND_URL` — `https://iillifoggyiilli.github.io/evrima-skins/`
- `SESSION_SECRET` — private random secret
- `SERVER_BRIDGE_TOKEN` — private token shared only with the Windows host bridge
- `SERVER_ID` — `foggy-evrima-pve`

Do not commit `SESSION_SECRET` or `SERVER_BRIDGE_TOKEN`.

Steam OpenID is used for identity. A Steam Web API key is not required. Persistent skin state remains on the Evrima host; the API only keeps the live apply queue in memory.

### Preview asset progress

`GET /api/assets/status?url=...` reports `not-cached`, `queued`, `connecting`, `downloading`, `cached`, or `failed` plus byte counts. The endpoint accepts the same restricted IslePilot skinviewer URLs as `/api/assets`.

`ASSET_CACHE_DIR` is optional. When set to a mounted persistent volume path, the Railway-side asset cache survives deployments. Without it, the web client's persistent Cache Storage still prevents repeat downloads on the same browser.

## Steam library protocol

Authenticated users submit library operations through `POST /api/library/op` and poll `GET /api/library/status/:id`. Railway does not persist the library itself: the authenticated server bridge receives `libraryCommands` from `/api/server/commands`, applies them to `SkinWebLibrary.json`, and reports results through `POST /api/server/library/result`. This keeps the persistent source of truth on the dedicated server.

### Live Apply status

`GET /api/skins/status/:id` now returns species, pattern, bridge-online state, and lifecycle timestamps. `GET /api/skins/recent` returns the signed-in user's eight most recent in-memory Apply requests. New Apply requests are rejected with HTTP 503 when the bridge heartbeat is offline instead of being silently queued into a dead path.

### v0.8.0 hardening

- Apply requests are Steam-session owned; SteamID is never accepted from the browser payload.
- One in-flight Apply per Steam account prevents stale same-player races while still allowing different players to Apply concurrently.
- `clientNonce` makes retries idempotent.
- Species, species-specific PatternIndex, SkinVariation, ThemeIndex and all ten colours are strictly validated instead of clamped.
- Apply and library rate limits include a per-Steam bucket in addition to IP limits.
- Bridge state-changing endpoints require the configured `SERVER_ID`; final results require the exact request SteamID and are ignored after terminal completion.
- `/api/server/commands` now returns `server` and uses `commandId` for library operations so a target skin ID cannot overwrite the library command ID.

### Advanced library operations

API v0.8.1 validates and forwards `metadata` operations (`id`, up to 8 tags, visibility) and `import` operations (1–50 validated skins) to Bridge v0.7.2. Visibility accepts only `private`, `unlisted`, or `public`; it is metadata only until the publishing API is introduced. Imported skins pass the same species/pattern/variation/colour validation as normal cloud saves.

### Publishing API

API v0.8.1 adds authenticated `POST /api/community/op` actions (`mine`, `publish`, `update`, `unpublish`, `delete`), public `GET /api/community/public`, and public/unlisted `GET /api/community/item/:id`. Publishing commands reuse the hardened bridge command/result transport, but Steam ownership always comes from the signed session. The bridge heartbeat supplies a sanitized catalogue cache; durable authority remains `SkinWebCommunity.json` on the server machine.

### Community Discovery v0.8.1

`GET /api/community/public` exposes up to 200 sanitized Public snapshots including save/favourite counts and the prepared featured flag. Authenticated `community-save`, `community-favorite`, and `community-favorites` operations are delegated to Bridge v0.8.1 so ownership, duplicate detection and persistent counters remain authoritative on the server. Unlisted snapshots remain accessible only by exact item link and are never returned by the public catalogue.

## Discord ↔ Steam account linking (v0.9.0)

Additional variables: `PRIMEVAL_BOT_API_TOKEN`, `DISCORD_GUILD_ID`, and `ACCOUNT_LINKS_FILE`. On Railway, mount a persistent volume at `/data` and set `ACCOUNT_LINKS_FILE=/data/primeval-refuge-account-links.json`. Steam OpenID is authoritative; account ownership is one-to-one and bot routes require the dedicated bot bearer token.
