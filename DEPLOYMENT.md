# Deployment

## v0.8.3 update order

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

After deployment, `/health` should report API version `0.6.2`.

## GitHub Pages

After the commit finishes deploying:

1. Open the live skin creator.
2. Hard-refresh with `Ctrl + Shift + R`.
3. Confirm the header shows **Web v0.8.3**.
4. Test Tyrannosaurus first.
5. Change Pattern 1 → 2 → 3 and confirm the source texture changes.
6. Test several different species such as Deinosuchus, Omniraptor, Triceratops and Pteranodon.
7. Apply one skin in game to ensure the existing apply pipeline is unchanged.

Austroraptor intentionally uses its reference image until a verified exact asset is found.

## Suggested commit messages

For the full v0.8.3 update in one commit:

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

No new variable is required for v0.8.3. The browser now persistently caches preview assets on each device. If you later attach a Railway volume, you can additionally set `ASSET_CACHE_DIR` to a directory on that mounted volume (for example `/data/foggy-evrima-skin-assets`) so Railway's own asset cache also survives redeploys.
