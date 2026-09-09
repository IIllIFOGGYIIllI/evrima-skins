## Web v0.9.2 / API v0.7.2 / Bridge v0.7.1 / UE4SS v0.6.2 — Multiplayer Hardening

- Adds one in-flight Apply per Steam account while preserving concurrent Applies for different players.
- Adds per-Steam Apply/library rate limits and idempotent Apply nonces.
- Strictly validates species-specific pattern ranges, variation, disabled ThemeIndex and all colours.
- Adds server-ID binding to bridge ACK/result/library-result calls.
- Adds persistent bridge replay protection so a lost ACK cannot apply the same request twice.
- Makes cloud delete idempotent and fixes library command-ID/skin-ID separation.
- Ignores stale/duplicate terminal result uploads.
- Adds live dinosaur species mismatch rejection in UE4SS.
- Preserves the single UE4SS worker, persistence, cloud library and v0.8.3 preview pipeline.

## Web v0.9.1 / API v0.7.1 — Live Apply Status

- Adds a five-stage Apply tracker: Sending, Railway, Bridge, UE4SS handoff, Applied.
- Adds authenticated recent Apply history plus browser-local history.
- Adds lifecycle timestamps for queued, bridge delivery, UE4SS acceptance and completion.
- Shows bridge-offline/restarting context while a request is pending.
- Rejects new Apply requests server-side when the bridge heartbeat is offline.
- Preserves the working UE4SS mod, bridge, cloud library and v0.8.3 preview pipeline.
- Does not invent a separate “player found” stage because the current UE4SS worker only reports the final server-side result.

## Web v0.9.0 / API v0.7.0 / Bridge v0.7.0 — Steam Cloud Skin Library

- Adds a SteamID-scoped server-backed saved skin library with up to 50 skins per account.
- Adds save/update, load, rename, duplicate, delete and favourite controls.
- Records the last successfully applied website skin server-side.
- Keeps browser-local saves as a fallback and queues failed cloud saves for later retry.
- Stores authoritative library data atomically in `SkinWebLibrary.json` on the dedicated server rather than Railway ephemeral storage.
- Extends the existing authenticated bridge protocol without changing UE4SS `main.lua` or the working skin-apply path.
- Preserves v0.8.3 preview caching/progress and the researched Evrima renderer.

## Web v0.8.3 / API v0.6.2 — Persistent Preview Cache + Progress

- Adds live byte/percentage progress for first-time Evrima model and texture downloads.
- Adds browser Cache Storage persistence so previously loaded preview assets survive Railway restarts/redeploys on the same browser.
- Adds `/api/assets/status` with queued/connecting/downloading/cached state.
- Adds optional `ASSET_CACHE_DIR` support for a future persistent Railway volume.
- Preserves the verified species registry and researched rendering/material pipeline.

# Changelog

## Website v0.8.2 / API v0.6.1

- Fixed the 25-second asset abort that could crash the Railway Node process while a model body was still downloading.
- Replaced whole-buffer upstream fetching with streamed `.part` downloads and atomic rename-on-success caching.
- Uses a 30-second inactivity timeout instead of a fixed total-transfer deadline.
- Deduplicates duplicate requests and serializes first-time CDN downloads so large assets do not compete.
- Removed the independent 12-second browser preview watchdog.
- Loads the model and skin resources sequentially, matching the researched native viewer cache strategy.
- Added staged loading messages and accurate CDN / Railway errors instead of incorrectly claiming the backend is outdated.
- Existing skin Apply, Steam auth, bridge, UE4SS, persistence, registry paths and `config.js` remain unchanged.

## Website v0.8.1 / API v0.6.0

- Replaced guessed v0.8.0 IslePilot CDN paths with the researched public registry.
- Added Railway allowlisted skinviewer asset proxy because the CDN has no browser CORS headers.
- Ported the public reference-colour skin compositor, RAC cavity pass, normal/detail-normal pass, and researched Three.js material/light values.
- Pattern buttons select the corresponding source adult pattern texture.
- Removed the fake Austroraptor 3D assumption; reference-image fallback is used until an exact asset is verified.
- Bumped frontend cache keys so browsers do not keep the broken v0.8.0 scripts.
- Updated repository and Railway documentation.

## Website v0.8.0

- First species-specific Evrima preview foundation.
- Superseded by v0.8.1 because direct CDN loading ignored the CDN CORS restriction and several folder names were inferred incorrectly.

## Website v0.7.3 / CustomSkins v0.6.0

- Production colour / Pattern Index / Skin Variation baseline.
- Theme control removed from production.

## CustomSkins v0.6.1

- Persistent SteamID64 skin records.
- Delayed restore after pawn creation.
- Reconnect restore confirmed.
- Dedicated-server restart restore confirmed.
