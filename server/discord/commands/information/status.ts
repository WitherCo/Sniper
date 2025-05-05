
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "status",
  description: "Show the status of bot systems",
  category: "information",
  aliases: ["health"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;

    const client = interaction.client;
    const uptime = Math.floor(client.uptime! / 1000);
    
    const embed = new EmbedBuilder()
      .setTitle('Bot Status')
      .setColor("#5865F2")
      .addFields([
        { name: '⚡ Websocket', value: `${client.ws.ping}ms`, inline: true },
        { name: '⏰ Uptime', value: `<t:${Math.floor(Date.now()/1000) - uptime}:R>`, inline: true },
        { name: '🖥️ System', value: 'Online', inline: true },
        { name: '📊 Commands', value: `${client.commands.size}`, inline: true },
        { name: '🏠 Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: '👥 Users', value: `${client.users.cache.size}`, inline: true }
      ])
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
