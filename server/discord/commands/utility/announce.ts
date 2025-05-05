import { CommandInteraction, Message, EmbedBuilder, TextChannel } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "announce",
  description: "Create an announcement",
  category: "utility",
  aliases: ["announcement"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageMessages"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !announce <channel> <message>");
    }

    const channel = interaction.mentions.channels.first() as TextChannel;
    if (!channel || !channel.isTextBased()) {
      return interaction.reply("❌ Please mention a valid text channel");
    }

    const message = args.slice(1).join(" ");

    const embed = new EmbedBuilder()
      .setTitle("📢 Announcement")
      .setDescription(message)
      .setColor(0x3498db)
      .setFooter({ text: `Announced by ${interaction.author.tag}` })
      .setTimestamp();

    try {
      await channel.send({ embeds: [embed] });
      return interaction.reply(`✅ Announcement sent to ${channel}`);
    } catch (error) {
      console.error("Announce command error:", error);
      return interaction.reply("❌ Failed to send announcement. Make sure I have permission to send messages in that channel.");
    }
  }
} as DiscordCommand;