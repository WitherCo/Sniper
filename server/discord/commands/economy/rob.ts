import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "rob",
  description: "Attempt to rob another user",
  category: "economy",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
      {
        name: "amount",
        description: "The amount of coins",
        type: "INTEGER",
        required: false
      }
    ],
  async execute(interaction: CommandInteraction | Message) {
    const coins = Math.floor(Math.random() * 1000);
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `💰 Economy action completed: Attempt to rob another user\nCoins: ${coins}` });
    } else {
      return await interaction.reply(`💰 Economy action completed: Attempt to rob another user\nCoins: ${coins}`);
    }
  }
} as DiscordCommand;
