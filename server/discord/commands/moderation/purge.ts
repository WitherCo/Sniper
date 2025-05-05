import { CommandInteraction, Message, TextChannel, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "purge",
  description: "Delete multiple messages at once",
  category: "moderation",
  aliases: ["prune", "clear"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageMessages"],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !purge <amount> [user]");
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return interaction.reply("❌ Please provide a number between 1 and 100");
    }

    const channel = interaction.channel as TextChannel;
    const target = interaction.mentions.users.first();

    try {
      // Delete command message first
      await interaction.delete();

      let messages;
      if (target) {
        const allMessages = await channel.messages.fetch({ limit: 100 });
        const targetMessages = allMessages.filter(msg => msg.author.id === target.id).first(amount);
        messages = await channel.bulkDelete(targetMessages, true);
      } else {
        messages = await channel.bulkDelete(amount, true);
      }

      const embed = new EmbedBuilder()
        .setTitle("🗑️ Messages Purged")
        .setColor(0xFF0000)
        .addFields([
          { name: "Amount", value: `${messages.size} messages` },
          { name: "Channel", value: channel.name },
          { name: "Moderator", value: interaction.author.tag }
        ])
        .setTimestamp();

      if (target) {
        embed.addFields([{ name: "Target User", value: target.tag }]);
      }

      const reply = await channel.send({ embeds: [embed] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);

    } catch (error) {
      console.error("[PURGE ERROR]", error);
      return interaction.channel.send("❌ Failed to purge messages. Messages older than 14 days cannot be bulk deleted.");
    }
  }
} as DiscordCommand;