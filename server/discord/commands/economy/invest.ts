import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "invest",
  description: "Invest coins for a chance at profit",
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
      return await interaction.reply({ content: `💰 Economy action completed: Invest coins for a chance at profit\nCoins: ${coins}` });
    } else {
      return await interaction.reply(`💰 Economy action completed: Invest coins for a chance at profit\nCoins: ${coins}`);
    }
  }
} as DiscordCommand;
