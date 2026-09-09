# Changelog

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
