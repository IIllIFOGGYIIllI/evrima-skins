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
