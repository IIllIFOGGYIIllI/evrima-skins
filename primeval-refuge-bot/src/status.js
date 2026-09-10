import { config } from "./config.js";

export async function fetchPrimevalStatus(timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${config.apiBase}/api/public/status`, {
      headers: { "user-agent": "Primeval-Refuge-Bot/0.3.0" },
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`API HTTP ${response.status}`);
    const data = await response.json();
    return {
      apiOnline: true,
      bridgeOnline: Boolean(data?.online),
      serverId: String(data?.server || "Primeval Refuge"),
      lastHeartbeat: data?.lastHeartbeat || null
    };
  } catch (error) {
    return { apiOnline: false, bridgeOnline: false, error: error?.message || "Status unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
