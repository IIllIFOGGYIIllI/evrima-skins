# Primeval Refuge Bot v0.1.0

Permanent Discord bot foundation for **Primeval Refuge | Evrima PvE**.

## Included now

- Guild-scoped slash commands for immediate registration.
- `/setup confirm:PRIMEVAL` creates or repairs the Primeval Refuge roles, categories, text channels and voice channels.
- `/setupstatus` audits the expected structure.
- `/server` reads the existing public Primeval Refuge Skin API status without exposing bridge secrets.
- `/website` links to the branded Skin Studio.
- `/help` shows member/admin commands.
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
3. No privileged gateway intents need to be enabled for v0.1.0.
4. Copy the **Application ID**; this is `DISCORD_CLIENT_ID`.
5. In Discord, enable Developer Mode, right-click the Primeval Refuge server and **Copy Server ID**; this is `DISCORD_GUILD_ID`.
6. Put the three required values in Railway variables — never in GitHub.

Required variables:

```text
DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID
DISCORD_GUILD_ID
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
```

## Next milestones

- v0.2.0 — secure Discord ↔ Steam account linking.
- v0.3.0 — Skin Studio library/community/apply commands through a dedicated bot-to-API authentication path.
- later — private tickets/reports, moderation workflows, published-skin announcements and server automation.
