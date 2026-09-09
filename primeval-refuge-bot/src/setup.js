import {
  ChannelType, PermissionFlagsBits, PermissionsBitField
} from "discord.js";
import { ROLE_BLUEPRINT, CATEGORY_BLUEPRINT, expectedCounts } from "./blueprint.js";
import { brandedEmbed, BRAND } from "./brand.js";
import { config } from "./config.js";
import { log } from "./logger.js";

const SEED_FOOTER = "Primeval Refuge Setup v0.1.0";

function rolePermissions(flags) {
  return new PermissionsBitField(flags || []);
}

async function ensureRole(guild, spec, me) {
  let role = guild.roles.cache.find(r => r.name === spec.name && !r.managed);
  const data = {
    name: spec.name,
    color: spec.color,
    hoist: Boolean(spec.hoist),
    mentionable: false,
    permissions: rolePermissions(spec.permissions),
    reason: "Primeval Refuge /setup"
  };
  if (!role) role = await guild.roles.create(data);
  else if (role.position < me.roles.highest.position) await role.edit(data);
  else log.warn(`Existing role ${role.name} is above the bot role; using it without editing.`);
  return role;
}

function staffPermissionOverwrites(guild, roles, minAccess = "support") {
  const rank = { support: 1, moderator: 2, admin: 3 };
  const required = rank[minAccess] || 1;
  const overwrites = [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }];
  for (const [key, role] of Object.entries(roles)) {
    if (key === "member") continue;
    if ((rank[key] || 0) >= required) {
      overwrites.push({
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      });
    } else {
      overwrites.push({ id: role.id, deny: [PermissionFlagsBits.ViewChannel] });
    }
  }
  return overwrites;
}

function publicPermissionOverwrites(guild, roles, everyoneSend = true) {
  const base = {
    id: guild.roles.everyone.id,
    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
    deny: everyoneSend ? [] : [PermissionFlagsBits.SendMessages]
  };
  const overwrites = [base];
  if (!everyoneSend) {
    for (const key of ["admin", "moderator", "support"]) {
      const role = roles[key];
      if (!role) continue;
      overwrites.push({
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      });
    }
  }
  return overwrites;
}

async function ensureCategory(guild, spec, roles) {
  let channel = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === spec.name);
  const permissionOverwrites = spec.staffOnly
    ? staffPermissionOverwrites(guild, roles, "support")
    : publicPermissionOverwrites(guild, roles, true);
  if (!channel) {
    channel = await guild.channels.create({
      name: spec.name,
      type: ChannelType.GuildCategory,
      permissionOverwrites,
      reason: "Primeval Refuge /setup"
    });
  } else {
    await channel.edit({ name: spec.name, permissionOverwrites, reason: "Primeval Refuge /setup" });
  }
  return channel;
}

async function ensureChild(guild, category, spec, roles, categorySpec) {
  const type = spec.type ?? ChannelType.GuildText;
  let channel = guild.channels.cache.find(c => c.parentId === category.id && c.type === type && c.name === spec.name);
  let permissionOverwrites;
  if (categorySpec.staffOnly) {
    permissionOverwrites = staffPermissionOverwrites(guild, roles, spec.staffAccess || "support");
  } else if (type === ChannelType.GuildVoice) {
    permissionOverwrites = [{
      id: guild.roles.everyone.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
    }];
  } else {
    permissionOverwrites = publicPermissionOverwrites(guild, roles, spec.everyoneSend !== false);
  }

  const data = {
    name: spec.name,
    type,
    parent: category.id,
    permissionOverwrites,
    reason: "Primeval Refuge /setup"
  };
  if (type === ChannelType.GuildText && spec.topic) data.topic = spec.topic;

  if (!channel) channel = await guild.channels.create(data);
  else {
    const editData = { ...data };
    delete editData.type;
    await channel.edit(editData);
  }
  return channel;
}

async function hasSeed(channel, key) {
  if (!channel?.isTextBased()) return false;
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    return messages.some(m => m.author.id === channel.client.user.id && m.embeds.some(e => e.footer?.text === `${SEED_FOOTER} • ${key}`));
  } catch {
    return false;
  }
}

async function seedChannel(channel, key, embed) {
  if (!channel?.isTextBased() || await hasSeed(channel, key)) return;
  embed.setFooter({ text: `${SEED_FOOTER} • ${key}` });
  await channel.send({ embeds: [embed] });
}

async function seedCoreMessages(channels) {
  await seedChannel(channels.welcome, "welcome", brandedEmbed({
    title: "Welcome to Primeval Refuge",
    description: "**Primeval Refuge** is an Evrima PvE community built around a persistent dedicated server, community skin tools and a relaxed place to enjoy The Isle.\n\nUse the channels below to find server information, get help and join the community.",
    image: true,
    thumbnail: false
  }));

  await seedChannel(channels["server-info"], "server-info", brandedEmbed({
    title: BRAND.serverName,
    description: `**Map:** Gateway\n**Platform:** PC • The Isle: Evrima\n**Community:** PvE\n\n**Skin Studio:** ${config.websiteUrl}`
  }));

  await seedChannel(channels.rules, "rules", brandedEmbed({
    title: "Primeval Refuge Rules",
    description: "This channel is reserved for the official community and gameplay rules. Staff can replace or expand this message once the final ruleset is approved.\n\nUntil then: treat other players respectfully, do not exploit or intentionally disrupt the server, and follow staff instructions."
  }));

  await seedChannel(channels["report-info"], "report-info", brandedEmbed({
    title: "Player Reports",
    description: "Private report/ticket handling is planned for the permanent Primeval Refuge bot. **Do not post sensitive reports publicly.** Until tickets are enabled, contact an Admin or Moderator directly."
  }));
}

export async function applySetup(guild) {
  await guild.roles.fetch();
  await guild.channels.fetch();

  const me = guild.members.me || await guild.members.fetchMe();
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles) || !me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    throw new Error("The bot requires Manage Roles and Manage Channels before /setup can run.");
  }

  const roles = {};
  for (const spec of ROLE_BLUEPRINT) roles[spec.key] = await ensureRole(guild, spec, me);

  // Keep the managed roles in a predictable hierarchy under the bot's highest role.
  const highest = me.roles.highest.position;
  const desired = ["member", "support", "moderator", "admin"];
  let pos = Math.max(1, highest - desired.length);
  for (const key of desired) {
    const role = roles[key];
    if (role && role.position < highest) {
      try { await role.setPosition(pos++); } catch (error) { log.warn(`Could not position ${role.name}`, error); }
    }
  }

  const categories = {};
  const channels = {};
  for (const categorySpec of CATEGORY_BLUEPRINT) {
    const category = await ensureCategory(guild, categorySpec, roles);
    categories[categorySpec.key] = category;
    for (const channelSpec of categorySpec.channels) {
      channels[channelSpec.key] = await ensureChild(guild, category, channelSpec, roles, categorySpec);
    }
  }

  // Preserve blueprint ordering without touching unrelated user-created categories.
  for (let i = 0; i < CATEGORY_BLUEPRINT.length; i++) {
    const category = categories[CATEGORY_BLUEPRINT[i].key];
    try { await category.setPosition(i); } catch (error) { log.warn(`Could not position category ${category.name}`, error); }
  }
  for (const categorySpec of CATEGORY_BLUEPRINT) {
    for (let i = 0; i < categorySpec.channels.length; i++) {
      const child = channels[categorySpec.channels[i].key];
      try { await child.setPosition(i); } catch (error) { log.warn(`Could not position channel ${child.name}`, error); }
    }
  }

  await seedCoreMessages(channels);
  return { roles, categories, channels, counts: expectedCounts() };
}

export async function inspectSetup(guild) {
  await guild.roles.fetch();
  await guild.channels.fetch();
  const missingRoles = ROLE_BLUEPRINT.filter(spec => !guild.roles.cache.some(r => r.name === spec.name && !r.managed)).map(x => x.name);
  const missingCategories = [];
  const missingChannels = [];
  for (const categorySpec of CATEGORY_BLUEPRINT) {
    const category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === categorySpec.name);
    if (!category) {
      missingCategories.push(categorySpec.name);
      missingChannels.push(...categorySpec.channels.map(c => `${categorySpec.name} / ${c.name}`));
      continue;
    }
    for (const child of categorySpec.channels) {
      const type = child.type ?? ChannelType.GuildText;
      if (!guild.channels.cache.some(c => c.parentId === category.id && c.type === type && c.name === child.name)) {
        missingChannels.push(`${categorySpec.name} / ${child.name}`);
      }
    }
  }
  return { missingRoles, missingCategories, missingChannels, expected: expectedCounts() };
}
