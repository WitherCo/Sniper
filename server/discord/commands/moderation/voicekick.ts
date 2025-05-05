
import { CommandInteraction, Message, GuildMember } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "voicekick",
  description: "Kick a user from voice channel",
  category: "moderation",
  aliases: ["vkick"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["MoveMembers"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !voicekick <user> [reason]");
    }

    const target = interaction.mentions.members?.first() || 
      await interaction.guild?.members.fetch(args[0]).catch(() => null);

    if (!target) {
      return interaction.reply("❌ Could not find that user");
    }

    if (!target.voice.channel) {
      return interaction.reply("❌ User is not in a voice channel");
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target.voice.disconnect(reason);
      return interaction.reply(`✅ Kicked ${target.user.tag} from voice channel\nReason: ${reason}`);
    } catch (error) {
      console.error("[VOICEKICK ERROR]", error);
      return interaction.reply("❌ Failed to kick user from voice channel");
    }
  }
} as DiscordCommand;
