import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "serverinfo",
  description: "Display information about the server",
  category: "utility",
  aliases: ["server", "guild"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply("❌ This command can only be used in a server");
    }

    const owner = await guild.fetchOwner();
    const channels = guild.channels.cache;
    const roles = guild.roles.cache;

    const embed = new EmbedBuilder()
      .setTitle(`${guild.name} Server Information`)
      .setThumbnail(guild.iconURL() || '')
      .setColor(0x3498db)
      .addFields([
        { name: "🆔 Server ID", value: guild.id, inline: true },
        { name: "👑 Owner", value: owner.user.tag, inline: true },
        { name: "📅 Created At", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "👥 Members", value: `${guild.memberCount}`, inline: true },
        { name: "💬 Channels", value: `${channels.size}`, inline: true },
        { name: "👔 Roles", value: `${roles.size}`, inline: true },
        { name: "🌍 Region", value: guild.preferredLocale, inline: true },
        { name: "✨ Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
        { name: "🚀 Boosts", value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
      ])
      .setFooter({ text: `Requested by ${interaction.author.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;