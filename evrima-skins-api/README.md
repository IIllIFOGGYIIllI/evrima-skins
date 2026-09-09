# FOGGY Evrima Skin API v0.7.0

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
