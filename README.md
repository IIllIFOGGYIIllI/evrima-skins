# FOGGY Evrima Skin Studio

Browser skin creator for the **FOGGY Evrima PvE** The Isle: Evrima server.

**Live site:** https://iillifoggyiilli.github.io/evrima-skins/

## Current stack

| Component | Version | State |
| --- | --- | --- |
| Website / preview | **v0.8.2** | Researched renderer + stable sequential asset loading |
| Railway Skin API | **v0.6.1** | Apply API + streamed/cache-backed asset service |
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

## v0.8.2 preview renderer

v0.8.2 keeps the researched public IslePilot viewer registry and rendering pipeline introduced in v0.8.1, and fixes the first-load transport path that previously timed out and could restart the Railway process. The public `theisle-overlay` source documents that registry as extracted verbatim from the official overlay app; its folder names and filenames must **not** be derived from species names.

The preview pipeline now uses:

- verified per-species GLB model URLs
- the selected adult pattern PNG
- reference-colour zone replacement for Body / Markings / Flank / Underbelly / Detail / Display
- RAC cavity darkening
- per-species normal map
- shared tiled detail normal
- teeth / mouth / claw masks where the registry provides them
- the researched Three.js camera, light and material settings

The IslePilot CDN itself does not provide browser CORS headers. `evrima-skins-api` v0.6.1 therefore exposes a strict allowlisted asset service. Cache misses are streamed to a `.part` file, renamed only after a complete download, and then served from Railway's ephemeral cache. First-time asset downloads are serialized so large models and textures do not compete with each other. There is no fixed total-transfer timeout; a 30-second **inactivity** timeout only stops a genuinely stalled upstream connection.

**Austroraptor:** the researched public registry currently has no verified Austroraptor 3D entry. The site deliberately shows the Evrima reference image for Austroraptor instead of substituting a fake raptor model.

Pattern Variation is still applied to the live dinosaur by the server. Its exact browser material transform is not public in the researched viewer source, so v0.8.2 does not invent one.

## Architecture

```text
GitHub Pages skin creator
        |
        +---- GET /api/assets ----> Railway streamed/cache-backed IslePilot asset service
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

## Preview asset caching

Web v0.10.1 stores successfully downloaded Evrima preview assets in the browser Cache Storage API, so the same browser does not need to redownload them after a Railway restart or redeploy. Railway also exposes live first-download progress and keeps its existing server-side cache. If a persistent Railway volume is mounted later, set `ASSET_CACHE_DIR` to a path on that volume; otherwise the Railway cache remains temporary while the browser cache remains persistent.

## Steam-linked skin library

Web v0.10.1 adds a SteamID-scoped saved-skin library. Railway carries authenticated library operations to the existing FOGGY server bridge, while `SkinWebLibrary.json` in the dedicated-server root is the authoritative persistent store. This avoids putting player skin data in Railway's ephemeral filesystem and survives Railway redeploys, game-server restarts and browser changes.

Each Steam account can keep up to 50 skins with rename, duplicate, delete and favourite controls plus a server-recorded Last Applied snapshot. Browser-local saves remain enabled as a fallback. If the bridge is temporarily offline, normal browser saves still succeed and cloud saves are queued locally for retry when the bridge returns.

## Live Apply status

Web v0.10.1 shows the real request lifecycle already exposed by the working pipeline: browser sending, Railway queued, bridge delivery, UE4SS handoff, and the final applied/failed result. It does not invent a separate “player found” event because the current UE4SS worker only reports the final result. Pending requests also show when the bridge goes offline/restarts, and the browser keeps a small recent Apply history while the API exposes the authenticated user's recent in-memory requests.

## Multiplayer hardening

Web v0.10.1 / API v0.8.1 / Bridge v0.8.1 / UE4SS v0.6.2 harden the existing pipeline without adding extra UE4SS workers. Apply ownership always comes from the signed Steam session; client payloads cannot choose a SteamID. The API now allows only one in-flight Apply per Steam account, adds per-Steam rate limiting and idempotent client nonces, strictly validates species/pattern/variation values, verifies server identity on bridge writes, ignores stale/duplicate final results, and keeps different players independent. The bridge validates every command before writing the UE4SS inbox and keeps a persistent replay cache. UE4SS also rejects a website species that does not match the authenticated player's live dinosaur when the live species can be resolved.

## Advanced Library — v0.9.3

The Steam-linked library now supports name/species/tag search, species and favourites filtering, multiple sort modes, up to eight user tags per skin, and stored `private` / `unlisted` / `public` visibility metadata. Visibility is groundwork only in this release: no skin is published until the separate publishing milestone.

Users can export one cloud skin or their entire Steam-linked library as validated JSON, then import up to 50 entries at once. Imports are revalidated by the browser, API and bridge. The bridge skips exact design duplicates and never overwrites an existing cloud skin ID during import. Existing v0.9.2 library entries are migrated in place with empty tags and `private` visibility.

## Publishing Foundation — v0.10.0

The website is now split into top-level **Studio**, **My Library**, and **Publish** pages without duplicating the renderer or Apply pipeline. Page selection is stored in the `view` query parameter so Steam sign-in callbacks continue to use their existing session hash safely.

Publishing creates an explicit immutable snapshot of a Steam-library skin. Private library edits never modify that public/unlisted snapshot until the owner chooses **Update snapshot**. Each Steam account may keep up to 20 active publications. Owners can refresh a snapshot, switch Public/Unlisted visibility, unpublish, delete the published record, copy a share link, and preview the snapshot.

Durable community data is stored separately in `SkinWebCommunity.json` beside `SkinWebLibrary.json`; Railway only keeps a sanitized runtime cache so redeploys cannot destroy the catalogue. Public cache entries never include the owner's SteamID or private library ID. `SkinWebCommunity.json` is written atomically and is synchronized by Bridge v0.8.1.

Step 6C will build the searchable Community discovery page on top of this catalogue.

## Community Discovery — v0.10.1

The application now has dedicated Studio, My Library, Community and Publish pages. The Community page browses public published snapshots without Steam sign-in, supports search, species/tag filtering, New/Popular/Featured/Recently Updated views, public engagement counts, and mobile-first card actions. Signed-in users can save a validated private copy to their Steam library, favourite community skins persistently, preview with the same Evrima renderer, copy a share link, or Apply directly through the existing hardened Steam → Railway → Bridge → UE4SS path. Exact duplicate saves are idempotent and do not inflate popularity.

Featured data is supported by the catalogue now; explicit admin curation controls remain reserved for the moderation milestone. Mobile navigation is a safe-area-aware bottom tab bar with 44px+ touch targets, iOS-safe 16px form controls, single-column community cards and a responsive touch renderer.
