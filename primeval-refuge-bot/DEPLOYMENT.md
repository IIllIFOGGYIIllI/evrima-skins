# Primeval Refuge Bot v0.3.0 — Railway Deployment

## GitHub

Upload the entire `primeval-refuge-bot/` folder into the existing `IIllIFOGGYIIllI/evrima-skins` repository.

Suggested commit:

```text
Add Discord Skin Studio commands
```

## Create the second Railway service

Use the existing Railway project, but create a **new service** from the same GitHub repository.

- Repository: `IIllIFOGGYIIllI/evrima-skins`
- Branch: `main`
- Root directory: `/primeval-refuge-bot`
- Start command: automatic (`npm start`)

Do not change the existing `evrima-skins` service root directory (`/evrima-skins-api`).

## Variables on the BOT service only

```text
DISCORD_BOT_TOKEN=<private bot token>
DISCORD_CLIENT_ID=<Discord Application ID>
DISCORD_GUILD_ID=<Primeval Refuge Server ID>
PRIMEVAL_BOT_API_TOKEN=<private random token>
PRIMEVAL_WEBSITE_URL=https://iillifoggyiilli.github.io/evrima-skins/
PRIMEVAL_API_BASE=https://evrima-skins-production.up.railway.app
PRIMEVAL_LOGO_URL=https://iillifoggyiilli.github.io/evrima-skins/assets/Primeval_Refuge_Official_Logo.png
PRIMEVAL_BANNER_URL=https://iillifoggyiilli.github.io/evrima-skins/assets/Primeval_Refuge_Official_Banner.png
```

`OWNER_DISCORD_ID` is optional. The actual guild owner and members with Administrator permission can run setup regardless.

## Expected startup log

```text
Registered 10 guild slash commands.
Logged in as <bot-name> (<id>)
```

## Safety

- Never commit the bot token.
- Never reuse `SERVER_BRIDGE_TOKEN` as the Discord bot token or future bot API credential.
- Private Skin Studio commands use only the dedicated `PRIMEVAL_BOT_API_TOKEN`; never reuse the Discord bot token, Steam session token or `SERVER_BRIDGE_TOKEN`.
- `/setup` requires Administrator and the literal confirmation value `PRIMEVAL`.
- `/setup` does not delete unrelated channels or roles.

## API variables and persistence

Set the same `PRIMEVAL_BOT_API_TOKEN` on the API service, set `DISCORD_GUILD_ID`, mount a persistent volume at `/data`, and set `ACCOUNT_LINKS_FILE=/data/primeval-refuge-account-links.json`.

## v0.3.0

No additional Railway variables or volumes are required beyond the v0.2.0 account-link configuration. The API service must remain connected to the same `PRIMEVAL_BOT_API_TOKEN` and `DISCORD_GUILD_ID`.
