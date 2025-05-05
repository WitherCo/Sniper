import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "invite",
  description: "Get an invite link for the bot",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    const inviteLink = `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;
    const response = `🔗 Click here to invite me to your server: ${inviteLink}`;
    
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: response });
    } else {
      await interaction.reply(response);
    }
  }
} as DiscordCommand;
