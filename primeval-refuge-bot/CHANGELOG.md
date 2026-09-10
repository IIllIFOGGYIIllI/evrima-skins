# Changelog

## v0.2.0 — Discord ↔ Steam Account Linking

- Adds `/link`, `/account` and `/unlink`.
- Uses short-lived Steam OpenID verification tied to the invoking Discord account.
- Enforces one Discord ↔ one SteamID64.
- Adds dedicated authenticated bot-to-API routes and persistent account-link storage.
- Preserves all v0.1.0 setup/status behavior.


## v0.1.0 — Foundation + Discord Setup

- Adds the permanent Primeval Refuge Discord bot as its own Railway-ready service.
- Adds five guild-scoped slash commands: `/setup`, `/setupstatus`, `/server`, `/website`, `/help`.
- Adds an idempotent Discord blueprint with 4 managed roles, 8 categories and 34 text/voice channels.
- Adds private staff permissions and Admin-only server-management access.
- Adds branded welcome, rules, server-info and report-info seed embeds.
- Adds public Primeval Refuge API/bridge health reporting without using bridge secrets.
- Adds official Primeval Refuge logo/banner links for branded embeds.
- Uses only the standard Guilds gateway intent; no Message Content intent is required.
- Adds Railway deployment documentation and invite-URL helper.
