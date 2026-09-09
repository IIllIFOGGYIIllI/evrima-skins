# FOGGY Evrima Skin Studio

Browser skin creator for the **FOGGY Evrima PvE** The Isle: Evrima server.

**Live site:** https://iillifoggyiilli.github.io/evrima-skins/

## Current stack

| Component | Version | State |
| --- | --- | --- |
| Website / preview | **v0.8.1** | Researched Evrima renderer |
| Railway Skin API | **v0.6.0** | Apply API + CORS-safe asset proxy |
| Windows bridge | **v0.6.0** | Production safe handoff |
| UE4SS CustomSkins | **v0.6.1** | Persistence confirmed |

The server-side skin restore has been confirmed after both reconnect and a full dedicated-server restart.

## What the website does

- Steam OpenID sign-in.
- Ten live skin colour regions.
- Pattern Index and Skin Variation selection.
- Direct **Apply to My Dinosaur** through Railway → Windows bridge → UE4SS.
- Browser-local saved skins and FGY2 share codes.
- Live bridge status and apply acknowledgement.
- Species-specific 3D preview for every species for which a verified public Evrima viewer asset exists.

`ThemeIndex` is intentionally fixed to `0`. `SkinCode` is deliberately untouched.

## v0.8.1 preview renderer

v0.8.1 replaces the guessed CDN/model paths from v0.8.0 with the researched public IslePilot viewer registry and rendering pipeline. The public `theisle-overlay` source documents that registry as extracted verbatim from the official overlay app; its folder names and filenames must **not** be derived from species names.

The preview pipeline now uses:

- verified per-species GLB model URLs
- the selected adult pattern PNG
- reference-colour zone replacement for Body / Markings / Flank / Underbelly / Detail / Display
- RAC cavity darkening
- per-species normal map
- shared tiled detail normal
- teeth / mouth / claw masks where the registry provides them
- the researched Three.js camera, light and material settings

The IslePilot CDN itself does not provide browser CORS headers. `evrima-skins-api` v0.6.0 therefore exposes a strict allowlisted asset proxy so GitHub Pages can load the exact public assets without disabling browser security.

**Austroraptor:** the researched public registry currently has no verified Austroraptor 3D entry. The site deliberately shows the Evrima reference image for Austroraptor instead of substituting a fake raptor model.

Pattern Variation is still applied to the live dinosaur by the server. Its exact browser material transform is not public in the researched viewer source, so v0.8.1 does not invent one.

## Architecture

```text
GitHub Pages skin creator
        |
        +---- GET /api/assets ----> Railway allowlisted IslePilot asset proxy
        |
        +---- POST /api/skins/apply
                           |
                           v
                    Railway command queue
                           |
                           v
                 FOGGY_SkinWebBridge.ps1
                           |
                           v
                    UE4SS CustomSkins
                           |
                           v
                  live Evrima dinosaur
```

Friends use the website only. No client UE4SS, `.pak`, BAT file, game-file edit or chat command is required.

## Repository layout

```text
index.html
styles.css
app.js
viewer3d.js
evrima-registry.js
config.js
README.md
CHANGELOG.md
DEPLOYMENT.md
evrima-skins-api/
  server.js
  package.json
  test.js
  README.md
```

`preview3d.js` and `viewer_hq.js` are legacy preview experiments. Current preview development belongs in `viewer3d.js`.

## Security

- Steam sessions are HMAC signed by the Railway API.
- The server bridge uses its private bearer token.
- Apply results are scoped to the signed-in Steam account.
- New pending requests supersede older ones for the same player.
- Apply requests are rate limited.
- The asset proxy is restricted to the IslePilot skinviewer CDN path and known preview file extensions.
- Secrets are never placed in `config.js` or other frontend files.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). Normal website updates should never replace `config.js` unless the Railway public URL actually changes.
