import { ChannelType, PermissionFlagsBits } from "discord.js";

export const ROLE_BLUEPRINT = Object.freeze([
  {
    key: "admin", name: "Admin", color: 0xc7a64b, hoist: true,
    permissions: [
      PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageNicknames,
      PermissionFlagsBits.ViewAuditLog
    ]
  },
  {
    key: "moderator", name: "Moderator", color: 0x4f7d57, hoist: true,
    permissions: [
      PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.KickMembers, PermissionFlagsBits.ManageNicknames
    ]
  },
  { key: "support", name: "Support", color: 0xc47a3b, hoist: true, permissions: [] },
  { key: "member", name: "Member", color: 0x72806f, hoist: false, permissions: [] }
]);

const ro = { everyoneSend: false };
const chat = { everyoneSend: true };

export const CATEGORY_BLUEPRINT = Object.freeze([
  {
    key: "welcome", name: "🌿 WELCOME", channels: [
      { key: "welcome", name: "welcome", topic: "Welcome to Primeval Refuge — Evrima PvE Community.", ...ro },
      { key: "rules", name: "rules", topic: "Official Primeval Refuge community and gameplay rules.", ...ro },
      { key: "server-info", name: "server-info", topic: "Server information, links and connection details.", ...ro },
      { key: "announcements", name: "announcements", topic: "Official Primeval Refuge announcements.", ...ro }
    ]
  },
  {
    key: "community", name: "🦖 PRIMEVAL REFUGE", channels: [
      { key: "general", name: "general", topic: "General Primeval Refuge community chat.", ...chat },
      { key: "screenshots", name: "screenshots", topic: "Share your best Evrima screenshots.", ...chat },
      { key: "clips", name: "clips", topic: "Gameplay clips and memorable moments.", ...chat },
      { key: "dinosaur-chat", name: "dinosaur-chat", topic: "Species, mechanics, builds and dinosaur discussion.", ...chat },
      { key: "skin-showcase", name: "skin-showcase", topic: "Show off skins created with the Primeval Refuge Skin Studio.", ...chat },
      { key: "suggestions", name: "suggestions", topic: "Suggestions for the server, Discord and website.", ...chat }
    ]
  },
  {
    key: "server", name: "🛰 SERVER", channels: [
      { key: "server-status", name: "server-status", topic: "Primeval Refuge server and bridge status.", ...ro },
      { key: "server-updates", name: "server-updates", topic: "Server configuration and maintenance updates.", ...ro },
      { key: "known-issues", name: "known-issues", topic: "Known server, game and mod issues.", ...ro },
      { key: "bug-reports", name: "bug-reports", topic: "Report reproducible server, website or Skin Studio issues.", ...chat }
    ]
  },
  {
    key: "gameplay", name: "🐾 GAMEPLAY", channels: [
      { key: "group-finder", name: "group-finder", topic: "Find other Primeval Refuge players to group with.", ...chat },
      { key: "nesting", name: "nesting", topic: "Nesting requests and hatchling coordination.", ...chat },
      { key: "migration-chat", name: "migration-chat", topic: "Migration, patrol-zone and map discussion.", ...chat },
      { key: "new-player-help", name: "new-player-help", topic: "Questions and help for new Evrima players.", ...chat },
      { key: "species-guides", name: "species-guides", topic: "Staff-curated species guides and useful references.", ...ro }
    ]
  },
  {
    key: "skins", name: "🎨 SKIN STUDIO", channels: [
      { key: "skin-studio", name: "skin-studio", topic: "Primeval Refuge Skin Studio discussion and direct website links.", ...chat },
      { key: "skin-help", name: "skin-help", topic: "Help using the web Skin Studio and live Apply pipeline.", ...chat },
      { key: "published-skins", name: "published-skins", topic: "Public skins published through the Primeval Refuge Skin Studio.", ...ro },
      { key: "featured-skins", name: "featured-skins", topic: "Staff-featured Primeval Refuge community skins.", ...ro }
    ]
  },
  {
    key: "support", name: "🛟 SUPPORT", channels: [
      { key: "support", name: "support", topic: "General support. Private ticket/report handling will be added to the permanent bot later.", ...chat },
      { key: "report-info", name: "report-info", topic: "How to report players privately once the ticket system is enabled.", ...ro },
      { key: "appeals-info", name: "appeals-info", topic: "Appeal information and moderation contact guidance.", ...ro }
    ]
  },
  {
    key: "staff", name: "🛡 STAFF", staffOnly: true, channels: [
      { key: "staff-chat", name: "staff-chat", topic: "Private Primeval Refuge staff discussion.", staffAccess: "support" },
      { key: "staff-alerts", name: "staff-alerts", topic: "Bot, server and moderation alerts.", staffAccess: "support" },
      { key: "moderation-log", name: "moderation-log", topic: "Private moderation audit trail.", staffAccess: "moderator" },
      { key: "server-management", name: "server-management", topic: "Private owner/admin server operations.", staffAccess: "admin" }
    ]
  },
  {
    key: "voice", name: "🔊 VOICE", channels: [
      { key: "voice-general", name: "General", type: ChannelType.GuildVoice },
      { key: "voice-group-1", name: "Group 1", type: ChannelType.GuildVoice },
      { key: "voice-group-2", name: "Group 2", type: ChannelType.GuildVoice },
      { key: "voice-afk", name: "AFK", type: ChannelType.GuildVoice }
    ]
  }
]);

export function expectedCounts() {
  return {
    roles: ROLE_BLUEPRINT.length,
    categories: CATEGORY_BLUEPRINT.length,
    channels: CATEGORY_BLUEPRINT.reduce((n, c) => n + c.channels.length, 0)
  };
}
