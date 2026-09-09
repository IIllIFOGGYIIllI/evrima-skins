# Deployment

## v0.9.0 update order

This release fixes the live Railway asset transport and the GitHub Pages loading strategy. Commit the Railway and frontend files together so the service redeploys before/while Pages refreshes. No environment-variable change is required.

### Files to replace / add

At repository root:

- `index.html`
- `app.js`
- `viewer3d.js`
- `README.md`
- `CHANGELOG.md`
- `DEPLOYMENT.md`

Railway folder:

- `evrima-skins-api/server.js`
- `evrima-skins-api/package.json`
- `evrima-skins-api/README.md`

Do **not** replace:

- `config.js`
- `styles.css`
- bridge token / Railway secrets
- Windows bridge files
- UE4SS `main.lua`
- server manager

## Railway

Service root remains:

```text
/evrima-skins-api
```

No new environment variable is required. Existing variables remain unchanged.

After deployment, `/health` should report API version `0.7.0`.

## GitHub Pages

After the commit finishes deploying:

1. Open the live skin creator.
2. Hard-refresh with `Ctrl + Shift + R`.
3. Confirm the header shows **Web v0.9.3**.
4. Test Tyrannosaurus first.
5. Change Pattern 1 → 2 → 3 and confirm the source texture changes.
6. Test several different species such as Deinosuchus, Omniraptor, Triceratops and Pteranodon.
7. Apply one skin in game to ensure the existing apply pipeline is unchanged.

Austroraptor intentionally uses its reference image until a verified exact asset is found.

## Suggested commit messages

For the full v0.9.0 update in one commit:

```text
Fix Evrima asset streaming and preview stability
```

If documentation is committed separately:

```text
Update skin studio docs
```

For future preview-only GitHub Pages updates, use a short message such as:

```text
Improve Evrima skin previews
```

## Optional persistent Railway cache

No new variable is required for v0.9.0. The browser now persistently caches preview assets on each device. If you later attach a Railway volume, you can additionally set `ASSET_CACHE_DIR` to a directory on that mounted volume (for example `/data/foggy-evrima-skin-assets`) so Railway's own asset cache also survives redeploys.

## v0.9.0 cloud library bridge update

Replace `FOGGY_SkinWebBridge.ps1` in the dedicated-server root with Bridge v0.7.0. Do not replace `SkinWebBridge.config.json`; the existing API URL and bridge token remain valid. No new Railway variables, database or Railway volume are required. The bridge creates `SkinWebLibrary.json` automatically beside itself and writes it atomically.

## v0.9.2 / API v0.7.3 / Bridge v0.7.2

Install `FOGGY_SkinWebBridge.ps1` v0.7.1 and `main.lua` v0.6.2 on the server **before** deploying API v0.7.3. The new API requires the bridge to include the configured server ID on ACK/result/library-result writes. No new config variables or secrets are required. `SkinWebBridge.replay.json` is created automatically beside the bridge script.

## v0.9.3 / API v0.7.3 / Bridge v0.7.2

Install `FOGGY_SkinWebBridge.ps1` v0.7.2 before deploying API v0.7.3 so tag/visibility metadata and bulk imports persist in `SkinWebLibrary.json`. No config or secret changes are required. Existing library data is upgraded automatically and remains backward-safe; there is no wipe or manual migration.
