# FOGGY Evrima Skin API v0.6.0

Railway backend for the FOGGY Evrima Skin Studio.

## Responsibilities

- Steam OpenID identity and signed website sessions.
- Short-lived per-player skin apply queue.
- Authenticated Windows bridge heartbeat / command / acknowledgement / result endpoints.
- Strict read-only proxy for public IslePilot skinviewer assets used by the browser 3D preview.

The asset proxy exists because the IslePilot skinviewer CDN does not send browser CORS headers. The proxy is allowlisted to `https://islepilot.eu/cdn/skinviewer/` and only permits `.glb`, `.png`, and `.webp` assets. It is not a general-purpose URL proxy.

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
