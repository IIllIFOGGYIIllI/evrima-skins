# Primeval Refuge Bot v0.3.0

Permanent Discord bot foundation for **Primeval Refuge | Evrima PvE**.

## Included now

- Guild-scoped slash commands for immediate registration.
- `/setup confirm:PRIMEVAL` creates or repairs the Primeval Refuge roles, categories, text channels and voice channels.
- `/setupstatus` audits the expected structure.
- `/server` reads the existing public Primeval Refuge Skin API status without exposing bridge secrets.
- `/website` links to the branded Skin Studio.
- `/help` shows member/admin commands.
- `/link`, `/account` and `/unlink` securely connect Discord to Steam through Steam OpenID.
- `/skins` browses the linked Steam Skin Studio library with paging, search and favourites filtering.
- `/skin view` inspects a saved skin and links directly to it on the website.
- `/skin apply` sends a saved skin through the existing live Apply pipeline.
- `/skin status` reports the latest Railway → bridge → UE4SS lifecycle state.
- `/skin published` shows the member's own publishing records, including unlisted/unpublished entries.
- `/skin website` opens the website library or a specific saved skin.
- Official Primeval Refuge logo/banner are used from the existing GitHub Pages assets.
- Only the standard `Guilds` gateway intent is requested; no Message Content or other privileged intent is required.
- Railway-safe logging, presence and graceful shutdown.

## Setup blueprint

`/setup` manages these roles:

- Admin
- Moderator
- Support
- Member

And eight categories:

- 🌿 WELCOME
- 🦖 PRIMEVAL REFUGE
- 🛰 SERVER
- 🐾 GAMEPLAY
- 🎨 SKIN STUDIO
- 🛟 SUPPORT
- 🛡 STAFF
- 🔊 VOICE

The command is idempotent: it looks for the expected exact role/category/channel names, repairs their topics/permissions and creates only missing expected items. It does **not** delete unrelated custom roles or channels.

The STAFF category is private. `server-management` is Admin-only; `moderation-log` is Admin/Moderator; staff chat and alerts include Support.

## Discord application

1. Go to the Discord Developer Portal and create an application named **Primeval Refuge**.
2. Open **Bot** and create/reset the bot token. Keep it private.
3. No privileged gateway intents need to be enabled for v0.3.0.
4. Copy the **Application ID**; this is `DISCORD_CLIENT_ID`.
5. In Discord, enable Developer Mode, right-click the Primeval Refuge server and **Copy Server ID**; this is `DISCORD_GUILD_ID`.
6. Put the three required values in Railway variables — never in GitHub.

Required variables:

```text
DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID
DISCORD_GUILD_ID
PRIMEVAL_BOT_API_TOKEN
```

Optional variables are documented in `.env.example`.

### Invite permissions

The bot needs these permissions for `/setup`:

- View Channels
- Send Messages
- Embed Links
- Read Message History
- Manage Channels
- Manage Roles
- Manage Messages
- Manage Server
- Kick Members
- Ban Members
- Moderate Members
- Manage Nicknames
- View Audit Log

The bot's own Discord role must be **above** the Admin / Moderator / Support / Member roles it manages.

After setting `DISCORD_CLIENT_ID` locally, `npm run invite` prints the correct OAuth2 invite URL with `bot` + `applications.commands` scopes and the required permissions.

## Railway

This folder is designed to run as a **second Railway service** from the same GitHub repository.

Set the new service root directory to:

```text
/primeval-refuge-bot
```

Railway will detect `package.json` and run:

```text
npm start
```

Do not put the Discord token into the existing `evrima-skins` API service. The bot should have its own service variables.

## First run

Once the service says it has logged into Discord:

```text
/setup confirm:PRIMEVAL
```

Then verify:

```text
/setupstatus
/server
/website
/account
/skins
/skin status
```

## v0.3.0 Skin Studio security model

- The bot uses `PRIMEVAL_BOT_API_TOKEN`; it never receives or reuses a browser Steam session token.
- Discord IDs are translated to SteamID64 only inside the API using the verified persistent account-link store.
- `/skins`, `/skin view`, `/skin apply`, `/skin status` and `/skin published` return private data ephemerally.
- Bot library access is read-only. Applying a skin is the only v0.3.0 state-changing Skin Studio command.
- Apply requests keep the existing one-in-flight-per-Steam rule, validation and rate protection.
- The Windows bridge and UE4SS protocols are unchanged.

## Next milestones

- private tickets/reports and moderation workflows.
- opt-in published-skin announcements and featured-skin curation.
- server automation where it can be added without weakening multiplayer or account isolation.
