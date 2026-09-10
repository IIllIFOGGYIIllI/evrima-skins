import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder
} from "discord.js";
import { brandedEmbed, BRAND } from "./brand.js";
import { config } from "./config.js";
import { applySetup, inspectSetup } from "./setup.js";
import { fetchPrimevalStatus } from "./status.js";
import { getDiscordAccount, startDiscordLink, unlinkDiscordAccount } from "./accounts.js";
import {
  applyDiscordSkin, fetchDiscordLibrary, fetchDiscordPublished,
  getDiscordApplyRecent, getDiscordApplyStatus
} from "./skins.js";
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
  new SlashCommandBuilder().setName("link").setDescription("Securely link your Discord account to your Steam account"),
  new SlashCommandBuilder().setName("account").setDescription("Show your Primeval Refuge account link status").addUserOption(o => o.setName("member").setDescription("Admin: inspect another member")),
  new SlashCommandBuilder().setName("unlink").setDescription("Remove your Discord ↔ Steam account link").addStringOption(o => o.setName("confirm").setDescription("Type UNLINK to confirm").setRequired(true)),
  new SlashCommandBuilder()
    .setName("skins")
    .setDescription("Browse your linked Steam Skin Studio library")
    .addIntegerOption(o => o.setName("page").setDescription("Library page").setMinValue(1).setMaxValue(5))
    .addStringOption(o => o.setName("filter").setDescription("Filter by skin name, species or tag").setMaxLength(48))
    .addBooleanOption(o => o.setName("favorites").setDescription("Show favourites only")),
  new SlashCommandBuilder()
    .setName("skin")
    .setDescription("View, apply and manage Skin Studio access")
    .addSubcommand(s => s.setName("view").setDescription("Inspect one of your saved skins").addStringOption(o => o.setName("skin").setDescription("Skin name or ID shown by /skins").setRequired(true).setMaxLength(80)))
    .addSubcommand(s => s.setName("apply").setDescription("Apply one of your saved skins to your live dinosaur").addStringOption(o => o.setName("skin").setDescription("Skin name or ID shown by /skins").setRequired(true).setMaxLength(80)))
    .addSubcommand(s => s.setName("published").setDescription("Show your published Skin Studio entries").addIntegerOption(o => o.setName("page").setDescription("Published page").setMinValue(1).setMaxValue(2)))
    .addSubcommand(s => s.setName("status").setDescription("Check your latest Discord Apply request").addStringOption(o => o.setName("request").setDescription("Optional request ID or prefix").setMaxLength(40)))
    .addSubcommand(s => s.setName("website").setDescription("Open the website library, optionally at one saved skin").addStringOption(o => o.setName("skin").setDescription("Optional skin name or ID").setMaxLength(80))),
  new SlashCommandBuilder().setName("help").setDescription("Show Primeval Refuge bot commands")
].map(command => command.toJSON());

function websiteUrl(view = "", id = "") {
  const url = new URL(config.websiteUrl);
  if (view) url.searchParams.set("view", view);
  if (id) url.searchParams.set("skin", id);
  return url.toString();
}

function websiteButtons(url = config.websiteUrl, label = "Open Skin Studio") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel(label).setStyle(ButtonStyle.Link).setURL(url)
  );
}

function steamLinkButton(url) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Verify with Steam").setStyle(ButtonStyle.Link).setURL(url)
  );
}

function linkedAt(value) {
  const ts = Math.floor(Number(value || 0) / 1000);
  return ts > 0 ? `<t:${ts}:R>` : "Unknown";
}

function accountDescription(account, subjectLabel = "Your account") {
  if (!account?.linked) return `**${subjectLabel}:** Not linked\n\nRun \`/link\` to verify Steam through the official Steam OpenID page.`;
  const a = account.account;
  return `**${subjectLabel}:** Linked\n**SteamID64:** \`${a.steam}\`\n**Linked:** ${linkedAt(a.linkedAt)}`;
}

function cleanDiscordText(value, max = 80) {
  return String(value || "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .replace(/([\\`*_{}\[\]()#+\-.!|>~])/g, "\\$1");
}

function speciesName(value) {
  const text = String(value || "Unknown").replace(/[-_]+/g, " ");
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

function variationName(value) {
  return ["Small", "Medium", "Large"][Number(value)] || "Unknown";
}

function shortId(value) {
  return String(value || "").slice(0, 8);
}

function sortSkins(items) {
  return [...items].sort((a, b) =>
    Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) ||
    Number(b.updatedAt || 0) - Number(a.updatedAt || 0) ||
    String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" })
  );
}

function resolveSkin(items, selector) {
  const list = Array.isArray(items) ? items : [];
  const raw = String(selector || "").trim();
  const needle = raw.toLowerCase();
  if (!needle) return { error: "Enter a skin name or the ID shown by `/skins`." };

  const exactId = list.find(s => String(s.id || "").toLowerCase() === needle);
  if (exactId) return { skin: exactId };

  if (needle.length >= 4) {
    const idMatches = list.filter(s => String(s.id || "").toLowerCase().startsWith(needle));
    if (idMatches.length === 1) return { skin: idMatches[0] };
    if (idMatches.length > 1) return { error: "That ID prefix matches more than one skin. Use a longer ID prefix from `/skins`." };
  }

  const exactName = list.filter(s => String(s.name || "").trim().toLowerCase() === needle);
  if (exactName.length === 1) return { skin: exactName[0] };
  if (exactName.length > 1) return { error: "More than one saved skin has that name. Use the ID shown by `/skins`." };

  const partial = list.filter(s => String(s.name || "").toLowerCase().includes(needle));
  if (partial.length === 1) return { skin: partial[0] };
  if (partial.length > 1) return { error: "That name matches multiple skins. Use a more specific name or the ID from `/skins`." };
  return { error: `No saved skin matched **${cleanDiscordText(raw, 48)}**. Run \`/skins\` to see your library.` };
}

function bodyColor(skin) {
  const value = String(skin?.colors?.body || "").replace(/^#/, "");
  return /^[0-9a-f]{6}$/i.test(value) ? Number.parseInt(value, 16) : BRAND.green;
}

function skinDetails(skin) {
  const tags = Array.isArray(skin.tags) && skin.tags.length ? skin.tags.map(t => cleanDiscordText(t, 20)).join(", ") : "None";
  const colors = Object.entries(skin.colors || {})
    .slice(0, 10)
    .map(([key, value]) => `${speciesName(key)} \`${String(value || "").toUpperCase()}\``)
    .join(" • ");
  const updated = Number(skin.updatedAt || 0) > 0 ? `<t:${Math.floor(Number(skin.updatedAt) / 1000)}:R>` : "Unknown";
  return [
    `**Name:** ${cleanDiscordText(skin.name || "Saved Skin", 80)}`,
    `**Species:** ${speciesName(skin.species)}`,
    `**Pattern:** ${Number(skin.patternIndex || 0) + 1}`,
    `**Variation:** ${variationName(skin.skinVariation)}`,
    `**Preview sex:** ${skin.previewSex === "female" ? "Female" : "Male"}`,
    `**Favourite:** ${skin.favorite ? "★ Yes" : "No"}`,
    `**Visibility:** ${speciesName(skin.visibility || "private")}`,
    `**Tags:** ${tags}`,
    `**Updated:** ${updated}`,
    `**Library ID:** \`${skin.id}\``,
    colors ? `\n**Palette**\n${colors}` : ""
  ].filter(Boolean).join("\n");
}

function applyStatusLabel(status) {
  return ({ queued: "Queued in Railway", delivered: "Delivered to server bridge", accepted: "Handed to UE4SS", applied: "Applied", failed: "Failed", superseded: "Superseded" })[status] || speciesName(status || "unknown");
}

function applyStatusDescription(request) {
  const lines = [
    `**Status:** ${applyStatusLabel(request.status)}`,
    request.species ? `**Species:** ${speciesName(request.species)} • Pattern ${Number(request.patternIndex || 0) + 1} • ${variationName(request.skinVariation)}` : "",
    request.message ? `**Message:** ${cleanDiscordText(request.message, 240)}` : "",
    request.bridgeOnline === false && !["applied", "failed", "superseded"].includes(request.status) ? "**Bridge:** Offline or restarting" : "",
    `**Request:** \`${request.id}\``
  ].filter(Boolean);
  const timeline = request.timeline || {};
  if (timeline.queuedAt) lines.push(`**Queued:** <t:${Math.floor(timeline.queuedAt / 1000)}:R>`);
  if (timeline.deliveredAt) lines.push(`**Bridge received:** <t:${Math.floor(timeline.deliveredAt / 1000)}:R>`);
  if (timeline.acceptedAt) lines.push(`**UE4SS handoff:** <t:${Math.floor(timeline.acceptedAt / 1000)}:R>`);
  if (timeline.completedAt) lines.push(`**Completed:** <t:${Math.floor(timeline.completedAt / 1000)}:R>`);
  return lines.join("\n");
}

function commandErrorMessage(error) {
  if (error?.code === "ACCOUNT_NOT_LINKED") return "Your Discord account is not linked to Steam yet. Run `/link` first.";
  if (error?.code === "BRIDGE_OFFLINE") return "The Primeval Refuge server bridge is offline or restarting. Your library is safe; try again when `/server` shows the bridge online.";
  if (error?.code === "APPLY_IN_PROGRESS") return "You already have an Apply request in progress. Use `/skin status` before sending another.";
  if (error?.status === 429) return "That action is being rate-limited. Wait a moment and try again.";
  return error?.message || "The Skin Studio request failed.";
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

async function handleLink(interaction) {
  if (!await guardGuild(interaction)) return;
  await interaction.deferReply({ ephemeral: true });
  try {
    const current = await getDiscordAccount(interaction.user.id);
    if (current.linked) return interaction.editReply({ embeds: [brandedEmbed({ title: "Account already linked", description: accountDescription(current), color: BRAND.green })], components: [websiteButtons()] });
    const link = await startDiscordLink(interaction.user);
    await interaction.editReply({
      embeds: [brandedEmbed({
        title: "Link Discord to Steam",
        description: "Use the secure button below to sign in through **Steam OpenID**. Primeval Refuge never receives your Steam password.\n\nThis verification link expires in **10 minutes** and is tied to your Discord account.",
        color: BRAND.green
      })],
      components: [steamLinkButton(link.linkUrl)]
    });
  } catch (error) {
    log.error("/link failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Link failed", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleAccount(interaction) {
  if (!await guardGuild(interaction)) return;
  const requested = interaction.options.getUser("member"), target = requested || interaction.user;
  if (target.id !== interaction.user.id && !canAdmin(interaction)) return interaction.reply({ content: "Only an Administrator can inspect another member's account link.", ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  try {
    const account = await getDiscordAccount(target.id), label = target.id === interaction.user.id ? "Your account" : `${target.username}'s account`;
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Primeval Refuge Account", description: accountDescription(account, label), color: account.linked ? BRAND.green : BRAND.accent })], components: [websiteButtons()] });
  } catch (error) {
    log.error("/account failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Account lookup failed", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleUnlink(interaction) {
  if (!await guardGuild(interaction)) return;
  if (interaction.options.getString("confirm", true).trim().toUpperCase() !== "UNLINK") return interaction.reply({ content: "Unlink cancelled. Run `/unlink confirm:UNLINK` when you intend to remove the association.", ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  try {
    const result = await unlinkDiscordAccount(interaction.user.id), description = result.unlinked ? "Your Discord account is no longer linked to Steam. Your Steam Skin Studio library is untouched." : "Your Discord account was not linked.";
    await interaction.editReply({ embeds: [brandedEmbed({ title: result.unlinked ? "Account unlinked" : "No account link found", description, color: result.unlinked ? BRAND.green : BRAND.accent })] });
  } catch (error) {
    log.error("/unlink failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Unlink failed", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleSkins(interaction) {
  if (!await guardGuild(interaction)) return;
  await interaction.deferReply({ ephemeral: true });
  try {
    const library = await fetchDiscordLibrary(interaction.user.id);
    const filter = String(interaction.options.getString("filter") || "").trim().toLowerCase();
    const favoritesOnly = Boolean(interaction.options.getBoolean("favorites"));
    let skins = sortSkins(library.skins);
    if (filter) skins = skins.filter(s => [s.name, s.species, ...(Array.isArray(s.tags) ? s.tags : [])].some(v => String(v || "").toLowerCase().includes(filter)));
    if (favoritesOnly) skins = skins.filter(s => Boolean(s.favorite));

    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(skins.length / perPage));
    const page = Math.min(Number(interaction.options.getInteger("page") || 1), totalPages);
    const pageItems = skins.slice((page - 1) * perPage, page * perPage);
    const description = pageItems.length
      ? pageItems.map((s, index) => `**${(page - 1) * perPage + index + 1}. ${cleanDiscordText(s.name || "Saved Skin", 56)}** ${s.favorite ? "★" : ""}\n${speciesName(s.species)} • Pattern ${Number(s.patternIndex || 0) + 1} • ${variationName(s.skinVariation)} • ID \`${shortId(s.id)}\``).join("\n\n")
      : (library.skins.length ? "No saved skins match those filters." : "Your Steam-linked Skin Studio library is empty.");

    const footer = `\n\n**Showing:** ${skins.length} of ${library.skins.length} saved skin${library.skins.length === 1 ? "" : "s"} • Page ${page}/${totalPages}\nUse a skin name or the displayed ID prefix with \`/skin view\` or \`/skin apply\`.`;
    await interaction.editReply({
      embeds: [brandedEmbed({ title: "My Skin Studio Library", description: description + footer, color: BRAND.green })],
      components: [websiteButtons(websiteUrl("library"), "Open My Library")]
    });
  } catch (error) {
    log.error("/skins failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Library unavailable", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleSkinView(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const library = await fetchDiscordLibrary(interaction.user.id);
    const resolved = resolveSkin(library.skins, interaction.options.getString("skin", true));
    if (!resolved.skin) return interaction.editReply({ embeds: [brandedEmbed({ title: "Skin not found", description: resolved.error, color: BRAND.accent })] });
    const skin = resolved.skin;
    await interaction.editReply({
      embeds: [brandedEmbed({ title: cleanDiscordText(skin.name || "Saved Skin", 80), description: skinDetails(skin), color: bodyColor(skin) })],
      components: [websiteButtons(websiteUrl("library", skin.id), "Open This Skin")]
    });
  } catch (error) {
    log.error("/skin view failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Skin lookup failed", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleSkinApply(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const library = await fetchDiscordLibrary(interaction.user.id);
    const resolved = resolveSkin(library.skins, interaction.options.getString("skin", true));
    if (!resolved.skin) return interaction.editReply({ embeds: [brandedEmbed({ title: "Skin not found", description: resolved.error, color: BRAND.accent })] });
    const skin = resolved.skin;
    const request = await applyDiscordSkin(interaction.user.id, skin);
    await interaction.editReply({
      embeds: [brandedEmbed({
        title: "Skin Apply queued",
        description: `**${cleanDiscordText(skin.name || "Saved Skin", 70)}** is being sent through the existing Primeval Refuge Apply pipeline.\n\n**Species:** ${speciesName(skin.species)}\n**Pattern:** ${Number(skin.patternIndex || 0) + 1}\n**Variation:** ${variationName(skin.skinVariation)}\n**Request:** \`${request.id}\`\n\nUse \`/skin status\` for the live bridge / UE4SS result.`,
        color: bodyColor(skin)
      })],
      components: [websiteButtons(websiteUrl("library", skin.id), "Open This Skin")]
    });
  } catch (error) {
    log.error("/skin apply failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Apply failed", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleSkinPublished(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const result = await fetchDiscordPublished(interaction.user.id);
    const items = [...result.items].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    const perPage = 10, totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const page = Math.min(Number(interaction.options.getInteger("page") || 1), totalPages);
    const pageItems = items.slice((page - 1) * perPage, page * perPage);
    const description = pageItems.length
      ? pageItems.map(item => {
        const state = item.published === false ? "Unpublished" : speciesName(item.visibility || "public");
        const species = speciesName(item.snapshot?.species || "unknown");
        return `**${cleanDiscordText(item.title || "Published Skin", 62)}** ${item.featured ? "◆ Featured" : ""}\n${state} • ${species} • Snapshot v${Number(item.snapshotVersion || 1)} • ID \`${shortId(item.id)}\``;
      }).join("\n\n")
      : "You have no published Skin Studio entries yet.";
    await interaction.editReply({
      embeds: [brandedEmbed({ title: "My Published Skins", description: `${description}\n\n**Total:** ${items.length} • Page ${page}/${totalPages}`, color: BRAND.green })],
      components: [websiteButtons(websiteUrl("publishing"), "Open Publishing")]
    });
  } catch (error) {
    log.error("/skin published failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Published skins unavailable", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleSkinStatus(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const selector = String(interaction.options.getString("request") || "").trim().toLowerCase();
    let request;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selector)) {
      request = await getDiscordApplyStatus(interaction.user.id, selector);
    } else {
      const recent = await getDiscordApplyRecent(interaction.user.id);
      const requests = Array.isArray(recent.requests) ? recent.requests : [];
      if (!requests.length) return interaction.editReply({ embeds: [brandedEmbed({ title: "No recent Apply requests", description: "Use `/skin apply` to send one of your saved Skin Studio skins to your live dinosaur.", color: BRAND.accent })] });
      if (!selector) request = requests[0];
      else {
        const matches = requests.filter(item => String(item.id || "").toLowerCase().startsWith(selector));
        if (matches.length !== 1) return interaction.editReply({ embeds: [brandedEmbed({ title: "Apply request not found", description: matches.length > 1 ? "That request prefix is ambiguous. Enter more of the request ID." : "That request is not in your recent Apply history.", color: BRAND.accent })] });
        request = matches[0];
      }
    }
    const terminal = ["applied", "failed", "superseded"].includes(request.status);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Skin Apply Status", description: applyStatusDescription(request), color: request.status === "applied" ? BRAND.green : request.status === "failed" ? BRAND.danger : BRAND.accent })], components: terminal ? [] : [websiteButtons(websiteUrl("studio"), "Open Skin Studio")] });
  } catch (error) {
    log.error("/skin status failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Apply status unavailable", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleSkinWebsite(interaction) {
  const selector = String(interaction.options.getString("skin") || "").trim();
  if (!selector) {
    return interaction.reply({
      embeds: [brandedEmbed({ title: "My Skin Studio Library", description: "Open your Steam-linked Primeval Refuge library on the website.", color: BRAND.green })],
      components: [websiteButtons(websiteUrl("library"), "Open My Library")],
      ephemeral: true
    });
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const library = await fetchDiscordLibrary(interaction.user.id);
    const resolved = resolveSkin(library.skins, selector);
    if (!resolved.skin) return interaction.editReply({ embeds: [brandedEmbed({ title: "Skin not found", description: resolved.error, color: BRAND.accent })] });
    const skin = resolved.skin;
    await interaction.editReply({
      embeds: [brandedEmbed({ title: "Open Skin Studio", description: `Open **${cleanDiscordText(skin.name || "Saved Skin", 70)}** directly in your website library.`, color: bodyColor(skin) })],
      components: [websiteButtons(websiteUrl("library", skin.id), "Open This Skin")]
    });
  } catch (error) {
    log.error("/skin website failed", error);
    await interaction.editReply({ embeds: [brandedEmbed({ title: "Website link unavailable", description: commandErrorMessage(error), color: BRAND.danger })] });
  }
}

async function handleSkin(interaction) {
  if (!await guardGuild(interaction)) return;
  switch (interaction.options.getSubcommand()) {
    case "view": return handleSkinView(interaction);
    case "apply": return handleSkinApply(interaction);
    case "published": return handleSkinPublished(interaction);
    case "status": return handleSkinStatus(interaction);
    case "website": return handleSkinWebsite(interaction);
    default: return interaction.reply({ content: "Unknown skin action.", ephemeral: true });
  }
}

async function handleHelp(interaction) {
  if (!await guardGuild(interaction)) return;
  const admin = canAdmin(interaction);
  const commands = [
    "`/link` — securely verify and link your Steam account",
    "`/account` — view your Discord ↔ Steam link status",
    "`/skins` — browse your Steam-linked Skin Studio library",
    "`/skin view` — inspect a saved skin",
    "`/skin apply` — send a saved skin through the live Apply pipeline",
    "`/skin status` — check your latest Apply result",
    "`/skin published` — view your own published entries",
    "`/skin website` — open your website library or a specific saved skin",
    "`/unlink` — remove the Discord ↔ Steam association",
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
    case "link": return handleLink(interaction);
    case "account": return handleAccount(interaction);
    case "unlink": return handleUnlink(interaction);
    case "skins": return handleSkins(interaction);
    case "skin": return handleSkin(interaction);
    case "help": return handleHelp(interaction);
    default: return interaction.reply({ content: "Unknown command.", ephemeral: true });
  }
}
