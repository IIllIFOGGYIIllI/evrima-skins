function required(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function cleanUrl(value, fallback) {
  const text = String(value || fallback || "").trim().replace(/\/+$/, "");
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") throw new Error("HTTPS required");
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid HTTPS URL: ${text}`);
  }
}

export const config = Object.freeze({
  token: required("DISCORD_BOT_TOKEN"),
  clientId: required("DISCORD_CLIENT_ID"),
  guildId: required("DISCORD_GUILD_ID"),
  botApiToken: required("PRIMEVAL_BOT_API_TOKEN"),
  ownerDiscordId: String(process.env.OWNER_DISCORD_ID || "").trim(),
  websiteUrl: cleanUrl(process.env.PRIMEVAL_WEBSITE_URL, "https://iillifoggyiilli.github.io/evrima-skins/"),
  apiBase: cleanUrl(process.env.PRIMEVAL_API_BASE, "https://evrima-skins-production.up.railway.app"),
  logoUrl: cleanUrl(process.env.PRIMEVAL_LOGO_URL, "https://iillifoggyiilli.github.io/evrima-skins/assets/Primeval_Refuge_Official_Logo.png"),
  bannerUrl: cleanUrl(process.env.PRIMEVAL_BANNER_URL, "https://iillifoggyiilli.github.io/evrima-skins/assets/Primeval_Refuge_Official_Banner.png")
});
