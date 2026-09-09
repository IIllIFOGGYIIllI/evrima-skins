# Primeval Refuge Bot v0.1.0 — Railway Deployment

## GitHub

Upload the entire `primeval-refuge-bot/` folder into the existing `IIllIFOGGYIIllI/evrima-skins` repository.

Suggested commit:

```text
Add Primeval Refuge Discord bot
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
PRIMEVAL_WEBSITE_URL=https://iillifoggyiilli.github.io/evrima-skins/
PRIMEVAL_API_BASE=https://evrima-skins-production.up.railway.app
PRIMEVAL_LOGO_URL=https://iillifoggyiilli.github.io/evrima-skins/assets/Primeval_Refuge_Official_Logo.png
PRIMEVAL_BANNER_URL=https://iillifoggyiilli.github.io/evrima-skins/assets/Primeval_Refuge_Official_Banner.png
```

`OWNER_DISCORD_ID` is optional. The actual guild owner and members with Administrator permission can run setup regardless.

## Expected startup log

```text
Registered 5 guild slash commands.
Logged in as <bot-name> (<id>)
```

## Safety

- Never commit the bot token.
- Never reuse `SERVER_BRIDGE_TOKEN` as the Discord bot token or future bot API credential.
- The bot currently calls only `/api/public/status`; no private skin/bridge routes are used in v0.1.0.
- `/setup` requires Administrator and the literal confirmation value `PRIMEVAL`.
- `/setup` does not delete unrelated channels or roles.
