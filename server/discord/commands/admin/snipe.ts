import { Client } from '../../structures/client';
import { Message } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

export default class SnipeCommand {
  public static async execute(client: Client, message: Message) {
    const channel = message.channel;
    if (!channel) return;

    const snipes = client.snipes.get(channel.id);
    if (!snipes) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('There are no deleted messages in this channel.'),
        ],
      });
    }

    const { author, content, timestamp, attachments } = snipes[0];
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setAuthor({ name: `${author.username}#${author.discriminator}`, iconURL: author.displayAvatarURL() })
      .setDescription(content)
      .setTimestamp(timestamp)
      .setFooter({ text: 'Sniped message' });

    if (attachments.length) {
      embed.setImage(attachments[0].proxyURL);
    }

    await message.reply({ embeds: [embed] });
  }
}
