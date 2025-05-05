
import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "massmove",
  description: "Move multiple users between voice channels",
  category: "moderation",
  aliases: ["moveall"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["MoveMembers"],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof Message) {
      await interaction.reply("This command is still under development");
    } else {
      await interaction.reply({ content: "This command is still under development", ephemeral: true });
    }
  }
} as DiscordCommand;
