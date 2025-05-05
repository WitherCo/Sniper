
import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "afk",
  description: "Set your AFK status",
  category: "utility",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    const userId = interaction instanceof Message ? interaction.author.id : interaction.user.id;
    const reason = args?.join(' ') || 'AFK';
    
    try {
      await storage.setAfkStatus(userId, reason);
      
      if (interaction instanceof Message) {
        await interaction.reply(`✅ Your status has been set to AFK: ${reason}`);
      } else {
        await interaction.reply({ content: `✅ Your status has been set to AFK: ${reason}`, ephemeral: true });
      }
    } catch (error) {
      console.error('Error setting AFK status:', error);
      const response = '❌ Failed to set AFK status';
      if (interaction instanceof Message) {
        await interaction.reply(response);
      } else {
        await interaction.reply({ content: response, ephemeral: true });
      }
    }
  }
} as DiscordCommand;
