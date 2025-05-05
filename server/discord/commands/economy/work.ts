import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "work",
  description: "Work to earn coins",
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
      return await interaction.reply({ content: `💰 Economy action completed: Work to earn coins\nCoins: ${coins}` });
    } else {
      return await interaction.reply(`💰 Economy action completed: Work to earn coins\nCoins: ${coins}`);
    }
  }
} as DiscordCommand;
