import { PermissionFlagsBits } from "discord.js";
import { config } from "./config.js";

export function isConfiguredGuild(interaction) {
  return interaction.guildId === config.guildId;
}

export function canAdmin(interaction) {
  if (!interaction.inGuild()) return false;
  if (interaction.guild?.ownerId === interaction.user.id) return true;
  if (config.ownerDiscordId && interaction.user.id === config.ownerDiscordId) return true;
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.Administrator));
}
