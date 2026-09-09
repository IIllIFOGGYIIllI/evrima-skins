# Deployment

## v0.8.1 update order

This release changes both GitHub Pages and the Railway API. Deploy **Railway first or in the same Git commit**. Until Railway v0.6.0 is live, the new preview correctly falls back because `/api/assets` does not exist yet.

### Files to replace / add

At repository root:

- `index.html`
- `app.js`
- `viewer3d.js`
- `evrima-registry.js` **(new)**
- `README.md`
- `CHANGELOG.md` **(new if absent)**
- `DEPLOYMENT.md` **(new if absent)**

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

After deployment, `/health` should report API version `0.6.0`.

## GitHub Pages

After the commit finishes deploying:

1. Open the live skin creator.
2. Hard-refresh with `Ctrl + Shift + R`.
3. Confirm the header shows **Web v0.8.1**.
4. Test Tyrannosaurus first.
5. Change Pattern 1 → 2 → 3 and confirm the source texture changes.
6. Test several different species such as Deinosuchus, Omniraptor, Triceratops and Pteranodon.
7. Apply one skin in game to ensure the existing apply pipeline is unchanged.

Austroraptor intentionally uses its reference image until a verified exact asset is found.

## Suggested commit messages

For the full v0.8.1 update in one commit:

```text
Fix Evrima 3D preview loading
```

If documentation is committed separately:

```text
Update skin studio docs
```

For future preview-only GitHub Pages updates, use a short message such as:

```text
Improve Evrima skin previews
```
