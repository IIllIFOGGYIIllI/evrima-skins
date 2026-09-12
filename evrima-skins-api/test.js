const { spawn } = require("child_process");
const crypto = require("crypto");
const path = require("path");
const os = require("os");
const fsp = require("fs/promises");
const { AccountLinkStore } = require("./account-links");

const port = 33491;
const discordId = "123456789012345678";
const steamId = "76561198000000001";
const guildId = "123456789012345678";
const botToken = "test-bot-token";
const bridgeToken = "test-bridge";
const serverId = "foggy-test";
const accountFile = path.join(os.tmpdir(), `primeval-account-links-test-${process.pid}.json`);
const base = `http://127.0.0.1:${port}`;
const sampleSkin = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Discord Test Rex",
  species: "tyrannosaurus",
  patternIndex: 1,
  skinVariation: 2,
  themeIndex: 0,
  previewSex: "male",
  colors: {
    body: "#112233", markings: "#223344", flank: "#334455", underbelly: "#445566", detail: "#556677",
    eyes: "#667788", breed: "#778899", teeth: "#8899AA", mouth: "#99AABB", claws: "#AABBCC"
  },
  favorite: true,
  tags: ["Discord", "Rex"],
  visibility: "private",
  updatedAt: Date.now()
};

const env = {
  ...process.env,
  PORT: String(port),
  PUBLIC_BASE_URL: base,
  FRONTEND_URL: "http://127.0.0.1:33492/",
  SESSION_SECRET: "test-session",
  SERVER_BRIDGE_TOKEN: bridgeToken,
  SERVER_ID: serverId,
  PRIMEVAL_BOT_API_TOKEN: botToken,
  DISCORD_GUILD_ID: guildId,
  ACCOUNT_LINKS_FILE: accountFile
};

const auth = token => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
const b64 = x => Buffer.from(x).toString("base64url");
const userSession = steam => { const payload=b64(JSON.stringify({steam,exp:Date.now()+60000})); const sig=b64(crypto.createHmac("sha256",env.SESSION_SECRET).update(payload).digest()); return payload+"."+sig; };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let child;
let finished = false;

async function cleanup(code, message) {
  if (finished) return;
  finished = true;
  if (message) console.log(message);
  if (child) child.kill();
  await fsp.rm(accountFile, { force: true }).catch(() => {});
  process.exit(code);
}

async function storeTests() {
  const file = path.join(os.tmpdir(), `primeval-account-store-${process.pid}.json`);
  const store = await new AccountLinkStore(file).init();
  await store.link({ discordId, steam: steamId, username: "Tester" });
  let conflict = false;
  try { await store.link({ discordId: "223456789012345678", steam: steamId }); }
  catch (error) { conflict = error.code === "STEAM_ALREADY_LINKED"; }
  if (!conflict) throw Error("one-to-one Steam constraint failed");
  const reloaded = await new AccountLinkStore(file).init();
  if (reloaded.getByDiscord(discordId)?.steam !== steamId) throw Error("store persistence failed");
  await reloaded.unlinkDiscord(discordId);
  await fsp.rm(file, { force: true }).catch(() => {});
}

async function request(url, options = {}) {
  const response = await fetch(base + url, options);
  let data = {};
  try { data = await response.json(); } catch {}
  return { response, data };
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const { response, data } = await request("/health");
      if (response.ok && data.ok) return data;
    } catch {}
    await sleep(100);
  }
  throw Error("API did not start");
}

async function main() {
  await storeTests();
  const seeded = await new AccountLinkStore(accountFile).init();
  await seeded.link({ discordId, steam: steamId, username: "Tester", displayName: "Test Survivor" });

  child = spawn(process.execPath, ["server.js"], { cwd: __dirname, env, stdio: ["ignore", "pipe", "pipe"] });
  child.stderr.on("data", data => process.stderr.write(data));

  const health = await waitForServer();
  if (health.version !== "0.10.1") throw Error("health version failed");

  let out = await request(`/api/discord/account/${discordId}`, { headers: auth(botToken) });
  if (!out.response.ok || out.data.account?.steam !== steamId) throw Error("Discord account lookup failed");

  out = await request("/api/discord/library/op", {
    method: "POST", headers: auth(botToken), body: JSON.stringify({ discordId, guildId, action: "list" })
  });
  if (out.response.status !== 503 || out.data.code !== "BRIDGE_OFFLINE") throw Error("offline library guard failed");

  out = await request("/api/server/heartbeat", {
    method: "POST", headers: auth(bridgeToken), body: JSON.stringify({ server: serverId, communityItems: [], communityRevision: 1, liveTracking: { enabled: true, ok: true, polledAt: Date.now() }, livePlayers: [{ playerId: steamId, name: "Test Survivor", species: "Tyrannosaurus", x: 123.5, y: -456.25, z: 78, growth: 75, health: 91, stamina: 88, hunger: 64, thirst: 52 }, { playerId: "EOS_ABCDEF1234567890", name: "EOS Test", species: "Omniraptor", x: 1, y: 2, z: 3, growth: 50 }] })
  });
  if (!out.response.ok) throw Error("heartbeat failed");

  out = await request("/api/live/me", { headers: auth(userSession(steamId)) });
  if (!out.response.ok || !out.data.online || out.data.player?.location?.x !== 123.5 || out.data.player?.species !== "Tyrannosaurus" || out.data.tracking?.playerCount !== 2) throw Error("personal live location failed");
  out = await request("/api/live/me");
  if (out.response.status !== 401) throw Error("personal live location auth guard failed");
  out = await request("/api/public/status");
  if (!out.data.liveTracking?.enabled || !out.data.liveTracking?.fresh) throw Error("public live tracking health failed");

  out = await request("/api/discord/library/op", {
    method: "POST", headers: auth(botToken), body: JSON.stringify({ discordId, guildId, action: "list" })
  });
  if (out.response.status !== 202 || !out.data.id) throw Error("Discord library queue failed");
  const libraryRequestId = out.data.id;

  out = await request("/api/server/commands", { headers: auth(bridgeToken) });
  const libraryCommand = out.data.libraryCommands?.find(item => item.commandId === libraryRequestId);
  if (!libraryCommand || libraryCommand.steam !== steamId || libraryCommand.action !== "list") throw Error("Discord library ownership failed");

  out = await request("/api/server/library/result", {
    method: "POST", headers: auth(bridgeToken), body: JSON.stringify({ server: serverId, id: libraryRequestId, steam: steamId, ok: true, data: { skins: [sampleSkin], lastApplied: null } })
  });
  if (!out.response.ok) throw Error("library result failed");

  out = await request(`/api/discord/library/status/${libraryRequestId}?discordId=${discordId}&guildId=${guildId}`, { headers: auth(botToken) });
  if (out.data.status !== "completed" || out.data.data?.skins?.[0]?.id !== sampleSkin.id) throw Error("Discord library result failed");

  out = await request("/api/discord/library/op", {
    method: "POST", headers: auth(botToken), body: JSON.stringify({ discordId, guildId, action: "community-mine" })
  });
  if (out.response.status !== 202 || !out.data.id) throw Error("Discord published queue failed");
  const publishedRequestId = out.data.id;
  out = await request("/api/server/commands", { headers: auth(bridgeToken) });
  const publishedCommand = out.data.libraryCommands?.find(item => item.commandId === publishedRequestId);
  if (!publishedCommand || publishedCommand.action !== "community-mine") throw Error("Discord published action failed");
  out = await request("/api/server/library/result", {
    method: "POST", headers: auth(bridgeToken), body: JSON.stringify({ server: serverId, id: publishedRequestId, steam: steamId, ok: true, data: { items: [{ id: "22222222-2222-4222-8222-222222222222", title: "Published Rex", visibility: "public", published: true, snapshotVersion: 1, snapshot: sampleSkin }] } })
  });
  if (!out.response.ok) throw Error("published result failed");

  out = await request("/api/discord/skins/apply", {
    method: "POST", headers: auth(botToken), body: JSON.stringify({ discordId, guildId, skin: sampleSkin })
  });
  if (out.response.status !== 202 || out.data.species !== sampleSkin.species) throw Error("Discord Apply queue failed");
  const applyId = out.data.id;

  out = await request("/api/server/commands", { headers: auth(bridgeToken) });
  const applyCommand = out.data.commands?.find(item => item.id === applyId);
  if (!applyCommand || applyCommand.steam !== steamId || applyCommand.colors.body !== "112233") throw Error("Discord Apply payload failed");

  out = await request(`/api/discord/skins/status/${applyId}?discordId=${discordId}&guildId=${guildId}`, { headers: auth(botToken) });
  if (!out.response.ok || !["queued", "delivered", "accepted"].includes(out.data.status)) throw Error("Discord Apply status failed");

  out = await request("/api/server/result", {
    method: "POST", headers: auth(bridgeToken), body: JSON.stringify({ server: serverId, id: applyId, steam: steamId, ok: true, message: "Skin applied" })
  });
  if (!out.response.ok || out.data.status !== "applied") throw Error("Apply completion failed");

  out = await request(`/api/discord/skins/recent/${discordId}?guildId=${guildId}`, { headers: auth(botToken) });
  if (out.data.requests?.[0]?.id !== applyId || out.data.requests?.[0]?.status !== "applied") throw Error("Discord recent Apply failed");

  out = await request(`/api/discord/skins/recent/223456789012345678?guildId=${guildId}`, { headers: auth(botToken) });
  if (out.response.status !== 409 || out.data.code !== "ACCOUNT_NOT_LINKED") throw Error("unlinked Discord guard failed");

  await cleanup(0, "Primeval Refuge API v0.10.1 live-location + Skin Studio tests passed");
}

main().catch(async error => {
  console.error(error);
  await cleanup(1);
});
setTimeout(() => cleanup(1, "timeout"), 12000);
