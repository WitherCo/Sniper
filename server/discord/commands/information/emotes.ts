
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "emotes",
  description: "Shows server emotes",
  category: "information",
  aliases: ["emojis"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;
    if (!interaction.guild) return interaction.reply("This command can only be used in a server!");

    const emotes = interaction.guild.emojis.cache;
    const animated = emotes.filter(e => e.animated);
    const regular = emotes.filter(e => !e.animated);

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name}'s Emotes`)
      .addFields([
        { 
          name: 'Regular Emotes', 
          value: regular.size > 0 ? regular.map(e => `${e}`).join(' ') : 'None', 
          inline: false 
        },
        { 
          name: 'Animated Emotes', 
          value: animated.size > 0 ? animated.map(e => `${e}`).join(' ') : 'None', 
          inline: false 
        }
      ])
      .setFooter({ text: `Total: ${emotes.size} | Regular: ${regular.size} | Animated: ${animated.size}` });

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
