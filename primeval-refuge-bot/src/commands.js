import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder
} from "discord.js";
import { brandedEmbed, BRAND } from "./brand.js";
import { config } from "./config.js";
import { applySetup, inspectSetup } from "./setup.js";
import { fetchPrimevalStatus } from "./status.js";
import { canAdmin, isConfiguredGuild } from "./security.js";
import { log } from "./logger.js";

export const commandData = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Build or repair the Primeval Refuge Discord layout")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName("confirm").setDescription("Type PRIMEVAL to confirm").setRequired(true)),
  new SlashCommandBuilder()
    .setName("setupstatus")
    .setDescription("Check the Primeval Refuge Discord layout")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName("server").setDescription("Show Primeval Refuge server status"),
  new SlashCommandBuilder().setName("website").setDescription("Open the Primeval Refuge Skin Studio"),
  new SlashCommandBuilder().setName("help").setDescription("Show Primeval Refuge bot commands")
].map(command => command.toJSON());

function websiteButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Open Skin Studio").setStyle(ButtonStyle.Link).setURL(config.websiteUrl)
  );
}

async function guardGuild(interaction) {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: "Primeval Refuge commands are only available inside the server.", ephemeral: true });
    return false;
  }
  if (!isConfiguredGuild(interaction)) {
    await interaction.reply({ content: "This bot is locked to the configured Primeval Refuge server.", ephemeral: true });
    return false;
  }
  return true;
}

async function handleSetup(interaction) {
  if (!await guardGuild(interaction)) return;
  if (!canAdmin(interaction)) return interaction.reply({ content: "Only the server owner or an Administrator can run setup.", ephemeral: true });
  if (interaction.options.getString("confirm", true).trim().toUpperCase() !== "PRIMEVAL") {
    return interaction.reply({ content: "Setup cancelled. Run `/setup confirm:PRIMEVAL` when you're ready.", ephemeral: true });
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const result = await applySetup(interaction.guild);
    const embed = brandedEmbed({
      title: "Primeval Refuge setup complete",
      description: `Discord structure is ready and idempotent. Re-running /setup repairs the expected layout instead of intentionally creating duplicates.\n\n**Roles:** ${result.counts.roles}\n**Categories:** ${result.counts.categories}\n**Channels:** ${result.counts.channels}`,
      color: BRAND.green
    });
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    log.error("/setup failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Setup failed", description: error.message, color: BRAND.danger })] });
  }
}

async function handleSetupStatus(interaction) {
  if (!await guardGuild(interaction)) return;
  if (!canAdmin(interaction)) return interaction.reply({ content: "Only the server owner or an Administrator can inspect setup.", ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const status = await inspectSetup(interaction.guild);
  const totalMissing = status.missingRoles.length + status.missingCategories.length + status.missingChannels.length;
  const lines = [
    `**Expected:** ${status.expected.roles} roles • ${status.expected.categories} categories • ${status.expected.channels} channels`,
    totalMissing ? "**State:** Needs repair" : "**State:** Complete",
    status.missingRoles.length ? `\n**Missing roles**\n${status.missingRoles.map(x => `• ${x}`).join("\n")}` : "",
    status.missingCategories.length ? `\n**Missing categories**\n${status.missingCategories.map(x => `• ${x}`).join("\n")}` : "",
    status.missingChannels.length ? `\n**Missing channels**\n${status.missingChannels.slice(0, 20).map(x => `• ${x}`).join("\n")}${status.missingChannels.length > 20 ? `\n• …and ${status.missingChannels.length - 20} more` : ""}` : ""
  ].filter(Boolean).join("\n");
  await interaction.editReply({ embeds: [brandedEmbed({ title: "Primeval Refuge setup status", description: lines, color: totalMissing ? BRAND.accent : BRAND.green })] });
}

async function handleServer(interaction) {
  if (!await guardGuild(interaction)) return;
  await interaction.deferReply();
  const status = await fetchPrimevalStatus();
  const heartbeat = status.lastHeartbeat ? `<t:${Math.floor(new Date(status.lastHeartbeat).getTime() / 1000)}:R>` : "Unavailable";
  const description = status.apiOnline
    ? `**Game server / local bridge:** ${status.bridgeOnline ? "🟢 Online" : "🔴 Offline or restarting"}\n**Skin API:** 🟢 Online\n**Last bridge heartbeat:** ${heartbeat}\n\n**Server:** ${BRAND.serverName}`
    : `**Game server / local bridge:** ⚪ Unknown\n**Skin API:** 🔴 Unreachable\n\n${status.error || "Status unavailable"}`;
  await interaction.editReply({ embeds: [brandedEmbed({ title: "Primeval Refuge Status", description, color: status.bridgeOnline ? BRAND.green : BRAND.accent })], components: [websiteButtons()] });
}

async function handleWebsite(interaction) {
  if (!await guardGuild(interaction)) return;
  await interaction.reply({
    embeds: [brandedEmbed({
      title: "Primeval Refuge Skin Studio",
      description: "Create, preview, save, publish, discover and apply Evrima skins through the Primeval Refuge website.",
      image: true,
      thumbnail: false
    })],
    components: [websiteButtons()]
  });
}

async function handleHelp(interaction) {
  if (!await guardGuild(interaction)) return;
  const admin = canAdmin(interaction);
  const commands = [
    "`/server` — live API / bridge status",
    "`/website` — open the Primeval Refuge Skin Studio",
    "`/help` — command overview"
  ];
  if (admin) commands.push("`/setup` — build/repair channels and roles", "`/setupstatus` — audit the expected Discord layout");
  await interaction.reply({ embeds: [brandedEmbed({ title: "Primeval Refuge Bot", description: commands.join("\n") })], components: [websiteButtons()], ephemeral: true });
}

export async function routeCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  switch (interaction.commandName) {
    case "setup": return handleSetup(interaction);
    case "setupstatus": return handleSetupStatus(interaction);
    case "server": return handleServer(interaction);
    case "website": return handleWebsite(interaction);
    case "help": return handleHelp(interaction);
    default: return interaction.reply({ content: "Unknown command.", ephemeral: true });
  }
}
