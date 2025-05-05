
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "timeout",
  description: "Timeout a user for a specified duration",
  category: "moderation", 
  aliases: ["mute"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ModerateMembers"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !timeout <user> <duration> [reason]\nDuration format: 1m, 1h, 1d");
    }

    const target = interaction.mentions.members?.first() || 
      await interaction.guild?.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return interaction.reply("❌ Could not find that user.");
    }

    if (!target.moderatable) {
      return interaction.reply("❌ I cannot moderate this user. They may have higher permissions than me.");
    }

    // Parse duration
    const durationArg = args[1].toLowerCase();
    let duration = 0;

    if (durationArg.endsWith('m')) duration = parseInt(durationArg) * 60 * 1000;
    else if (durationArg.endsWith('h')) duration = parseInt(durationArg) * 60 * 60 * 1000;
    else if (durationArg.endsWith('d')) duration = parseInt(durationArg) * 24 * 60 * 60 * 1000;
    
    if (!duration || duration <= 0 || duration > 2419200000) { // Max 28 days
      return interaction.reply("❌ Invalid duration. Use m (minutes), h (hours), or d (days). Maximum 28 days.");
    }

    const reason = args.slice(2).join(" ") || "No reason provided";

    try {
      await target.timeout(duration, reason);

      const timeoutEmbed = new EmbedBuilder()
        .setTitle("🔇 User Timed Out")
        .setColor(0xff6b6b)
        .setDescription(`**Member:** ${target.user.tag}\n**Duration:** ${durationArg}\n**Reason:** ${reason}`)
        .setTimestamp()
        .setFooter({ text: `Timed out by ${interaction.author.tag}` });

      await interaction.channel.send({ embeds: [timeoutEmbed] });

      return interaction.reply(`✅ Successfully timed out ${target.user.tag}`);
    } catch (error) {
      console.error("Timeout error:", error);
      return interaction.reply("❌ An error occurred while trying to timeout the user.");
    }
  }
} as DiscordCommand;
