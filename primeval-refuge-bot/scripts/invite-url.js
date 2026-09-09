import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

const clientId = String(process.env.DISCORD_CLIENT_ID || "").trim();
if (!clientId) {
  console.error("Set DISCORD_CLIENT_ID before running: npm run invite");
  process.exit(1);
}

const permissions = new PermissionsBitField([
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageNicknames,
  PermissionFlagsBits.ViewAuditLog
]);

const url = new URL("https://discord.com/oauth2/authorize");
url.searchParams.set("client_id", clientId);
url.searchParams.set("scope", "bot applications.commands");
url.searchParams.set("permissions", permissions.bitfield.toString());
console.log(url.toString());
