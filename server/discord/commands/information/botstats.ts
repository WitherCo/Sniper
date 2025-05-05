import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "botstats",
  description: "Show detailed bot statistics",
  category: "information",
  aliases: ["stats", "metrics"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;

    const client = interaction.client;
    const stats = await storage.getServerStats();

    const embed = new EmbedBuilder()
      .setTitle(`${client.user?.username} Statistics`)
      .setColor("#5865F2")
      .setThumbnail(client.user?.displayAvatarURL() || '')
      .addFields([
        { name: '📊 Commands', value: `Total: ${stats?.totalCommands || 0}\nPrefix: ${stats?.prefixCommands || 0}`, inline: true },
        { name: '🌐 Servers', value: `${stats?.activeServers || 0}`, inline: true },
        { name: '👥 Total Users', value: client.users.cache.size.toString(), inline: true },
        { name: '📈 Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: '⚡ Uptime', value: `${Math.floor(client.uptime! / 3600000)}h ${Math.floor((client.uptime! % 3600000) / 60000)}m`, inline: true },
        { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true }
      ])
      .setFooter({ text: `Requested by ${interaction.author.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;