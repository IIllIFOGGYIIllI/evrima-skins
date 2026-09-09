import {
  ActivityType, Client, Events, GatewayIntentBits, REST, Routes
} from "discord.js";
import { config } from "./config.js";
import { commandData, routeCommand } from "./commands.js";
import { log } from "./logger.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(config.token);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commandData });
  log.info(`Registered ${commandData.length} guild slash commands.`);
}

client.once(Events.ClientReady, async ready => {
  log.info(`Logged in as ${ready.user.tag} (${ready.user.id})`);
  ready.user.setPresence({
    activities: [{ name: "Primeval Refuge | Evrima PvE", type: ActivityType.Watching }],
    status: "online"
  });
});

client.on(Events.InteractionCreate, async interaction => {
  try { await routeCommand(interaction); }
  catch (error) {
    log.error("Unhandled interaction error", error);
    const payload = { content: "The command hit an unexpected error. Check the bot logs.", ephemeral: true };
    try {
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
      else await interaction.reply(payload);
    } catch (replyError) { log.error("Could not report interaction error", replyError); }
  }
});

client.on(Events.Error, error => log.error("Discord client error", error));
client.on(Events.Warn, warning => log.warn("Discord warning", warning));

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info(`Received ${signal}; shutting down.`);
  try { client.destroy(); } finally { process.exit(0); }
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", reason => log.error("Unhandled rejection", reason));
process.on("uncaughtException", error => { log.error("Uncaught exception", error); process.exit(1); });

try {
  await registerCommands();
  await client.login(config.token);
} catch (error) {
  log.error("Startup failed", error);
  process.exit(1);
}
