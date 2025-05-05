
import { CommandInteraction, Message, EmbedBuilder, TextChannel } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "firstmessage",
  description: "Find the first message in a channel",
  category: "information",
  aliases: ["firstmsg"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;
    
    const channel = interaction.channel as TextChannel;
    const messages = await channel.messages.fetch({ limit: 1, after: '0' });
    const firstMessage = messages.first();

    if (!firstMessage) {
      return interaction.reply("❌ Couldn't find the first message in this channel.");
    }

    const embed = new EmbedBuilder()
      .setTitle('First Message')
      .setColor("#5865F2")
      .setDescription(firstMessage.content || '*No content*')
      .addFields([
        { name: 'Author', value: `${firstMessage.author.tag}`, inline: true },
        { name: 'Date', value: `<t:${Math.floor(firstMessage.createdTimestamp / 1000)}:F>`, inline: true },
        { name: 'Jump to Message', value: `[Click Here](${firstMessage.url})`, inline: true }
      ])
      .setFooter({ text: `Message ID: ${firstMessage.id}` });

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
