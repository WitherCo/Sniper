
import { CommandInteraction, Message, GuildMember } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "deafen",
  description: "Deafen a member in voice channels",
  category: "moderation",
  aliases: ["vdeafen"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["DeafenMembers"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !deafen <user> [reason]");
    }

    const target = interaction.mentions.members?.first() || 
      await interaction.guild?.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return interaction.reply("❌ Could not find that user");
    }

    if (!target.voice.channel) {
      return interaction.reply("❌ User is not in a voice channel");
    }

    if (target.id === interaction.member?.user.id) {
      return interaction.reply("❌ You cannot deafen yourself");
    }

    if (!target.moderatable) {
      return interaction.reply("❌ I cannot moderate this user. They may have higher permissions than me.");
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target.voice.setDeaf(true, reason);
      return interaction.reply(`✅ Successfully deafened ${target.user.tag} for: ${reason}`);
    } catch (error) {
      console.error("[DEAFEN ERROR]", error);
      return interaction.reply("❌ Failed to deafen member. Please check my permissions.");
    }
  }
} as DiscordCommand;
