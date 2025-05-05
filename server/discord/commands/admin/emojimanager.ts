
import { Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "emojimanager",
  description: "Manage server emojis",
  category: "admin",
  aliases: ["emojimgr"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageEmojisAndStickers"],
  async execute(interaction: Message, args?: string[]) {
    if (!args?.length) {
      return interaction.reply("Usage: !emojimanager <list|add|remove> [emoji name]");
    }

    const action = args[0].toLowerCase();
    const embed = new EmbedBuilder()
      .setTitle("😄 Emoji Manager")
      .setTimestamp();

    switch (action) {
      case "list":
        const emojis = interaction.guild?.emojis.cache.map(emoji => 
          `${emoji} \`:${emoji.name}:\``
        ).join("\n");
        
        embed.setDescription("Server Emojis:")
          .addFields([{ name: "Available Emojis", value: emojis || "No custom emojis" }])
          .setColor("#0099ff");
        break;

      case "add":
        embed.setDescription("To add an emoji, upload an image with the command")
          .setColor("#00ff00");
        break;

      case "remove":
        if (!args[1]) {
          return interaction.reply("❌ Please specify an emoji name to remove");
        }
        embed.setDescription(`Attempting to remove emoji: ${args[1]}`)
          .setColor("#ff0000");
        break;

      default:
        return interaction.reply("❌ Invalid action. Use list, add, or remove.");
    }

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
