
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "shardinfo",
  description: "Display information about bot shards",
  category: "information",
  aliases: ["shards"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;

    const client = interaction.client;
    const shardId = client.shard?.ids[0] ?? 0;
    const shardCount = client.shard?.count ?? 1;

    const embed = new EmbedBuilder()
      .setTitle('Shard Information')
      .setColor("#5865F2")
      .addFields([
        { name: '🔹 Current Shard', value: `${shardId}`, inline: true },
        { name: '📊 Total Shards', value: `${shardCount}`, inline: true },
        { name: '📶 Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: '🏠 Servers on Shard', value: `${client.guilds.cache.size}`, inline: true }
      ])
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
