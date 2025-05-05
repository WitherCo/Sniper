
import { CommandInteraction, Message, EmbedBuilder, version as discordVersion } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "botinfo",
  description: "Display information about the bot",
  category: "information",
  aliases: ["bi", "info"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;

    const client = interaction.client;
    
    const embed = new EmbedBuilder()
      .setTitle(`${client.user?.username} Information`)
      .setColor("#5865F2")
      .setThumbnail(client.user?.displayAvatarURL() || '')
      .addFields([
        { name: '👑 Owner', value: `<@${process.env.OWNER_ID || 'Unknown'}>`, inline: true },
        { name: '🌐 Servers', value: client.guilds.cache.size.toString(), inline: true },
        { name: '👥 Users', value: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toString(), inline: true },
        { name: '📊 Commands', value: client.commands.size.toString(), inline: true },
        { name: '📚 Discord.js', value: `v${discordVersion}`, inline: true },
        { name: '⚙️ Node.js', value: process.version, inline: true }
      ])
      .setFooter({ text: `Requested by ${interaction.author.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
