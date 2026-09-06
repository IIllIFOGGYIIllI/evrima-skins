# FOGGY Evrima Skin API v0.3.1

Deploy this folder as a separate Railway service.

Required variables:

- `PUBLIC_BASE_URL` — Railway public HTTPS URL for this service
- `FRONTEND_URL` — `https://iillifoggyiilli.github.io/evrima-skins/`
- `SESSION_SECRET` — private random secret
- `SERVER_BRIDGE_TOKEN` — private token shared only with the Windows host bridge
- `SERVER_ID` — `foggy-evrima-pve`

Steam OpenID is used for identity. A Steam Web API key is not required.

The API only holds the short live apply queue in memory. Persistent skin state is kept on the actual Evrima host.
