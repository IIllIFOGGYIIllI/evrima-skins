import { EmbedBuilder } from "discord.js";
import { config } from "./config.js";

export const BRAND = Object.freeze({
  name: "Primeval Refuge",
  serverName: "Primeval Refuge | Evrima PvE",
  accent: 0xc5a34a,
  green: 0x315b3d,
  danger: 0x8f3f36,
  footer: "Primeval Refuge • Evrima PvE Community"
});

export function brandedEmbed({ title, description, color = BRAND.accent, thumbnail = true, image = false } = {}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title || BRAND.name)
    .setDescription(description || null)
    .setFooter({ text: BRAND.footer })
    .setTimestamp();
  if (thumbnail) embed.setThumbnail(config.logoUrl);
  if (image) embed.setImage(config.bannerUrl);
  return embed;
}
