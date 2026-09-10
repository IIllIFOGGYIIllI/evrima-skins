import { config } from "./config.js";

const USER_AGENT = "Primeval-Refuge-Bot/0.3.0";
const POLL_INTERVAL_MS = 700;
const POLL_ATTEMPTS = 45;

async function apiRequest(path, { method = "GET", body, timeoutMs = 6500 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${config.apiBase}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${config.botApiToken}`,
        "content-type": "application/json",
        "user-agent": USER_AGENT
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(String(data?.error || `Primeval API HTTP ${response.status}`));
      error.status = response.status;
      error.code = String(data?.code || "");
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Primeval API timed out");
      timeoutError.code = "API_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function linkedBody(discordId, extra = {}) {
  return { discordId: String(discordId), guildId: config.guildId, ...extra };
}

async function queueLibraryRead(discordId, action) {
  return apiRequest("/api/discord/library/op", {
    method: "POST",
    body: linkedBody(discordId, { action })
  });
}

async function pollLibraryRead(discordId, id) {
  const query = new URLSearchParams({ discordId: String(discordId), guildId: config.guildId });
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    const result = await apiRequest(`/api/discord/library/status/${encodeURIComponent(id)}?${query}`);
    if (result.status === "completed") return result;
    if (result.status === "failed") throw new Error(result.message || "Skin Studio operation failed");
  }
  const error = new Error("The server bridge did not confirm the Skin Studio request in time. Try again shortly.");
  error.code = "BRIDGE_TIMEOUT";
  throw error;
}

export async function fetchDiscordLibrary(discordId) {
  const queued = await queueLibraryRead(discordId, "list");
  const result = await pollLibraryRead(discordId, queued.id);
  return {
    skins: Array.isArray(result.data?.skins) ? result.data.skins : [],
    lastApplied: result.data?.lastApplied || null
  };
}

export async function fetchDiscordPublished(discordId) {
  const queued = await queueLibraryRead(discordId, "community-mine");
  const result = await pollLibraryRead(discordId, queued.id);
  return { items: Array.isArray(result.data?.items) ? result.data.items : [] };
}

export function applyDiscordSkin(discordId, skin) {
  return apiRequest("/api/discord/skins/apply", {
    method: "POST",
    body: linkedBody(discordId, { skin })
  });
}

export function getDiscordApplyStatus(discordId, requestId) {
  const query = new URLSearchParams({ discordId: String(discordId), guildId: config.guildId });
  return apiRequest(`/api/discord/skins/status/${encodeURIComponent(requestId)}?${query}`);
}

export function getDiscordApplyRecent(discordId) {
  const query = new URLSearchParams({ guildId: config.guildId });
  return apiRequest(`/api/discord/skins/recent/${encodeURIComponent(discordId)}?${query}`);
}
