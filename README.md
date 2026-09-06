# FOGGY Evrima Skin Studio v0.4.0

Frontend-only 3D preview upgrade.

## What changed

- Interactive WebGL 3D preview.
- Drag to rotate and mouse wheel to zoom.
- All 10 skin colours update the 3D preview immediately.
- Species selection rebuilds a species-specific procedural dinosaur model.
- The actual selected Evrima species render remains visible as an inset reference.
- Existing Steam sign-in, Railway API, Apply-to-Dinosaur, saved skins and share codes are unchanged.

## Important

The browser 3D geometry is created specifically for this website. It is not a redistributed copy of The Isle's proprietary game mesh.

The actual selected Evrima reference render is still shown in the viewer so players have the correct species appearance beside the live recolourable model.

## Install

Replace these files in the root of the GitHub repo:

- `index.html`
- `styles.css`
- `app.js`

Add:

- `preview3d.js`

Do **not** replace `config.js`; keep the current live Railway API URL.
