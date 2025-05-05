
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "poll",
  description: "Create a simple poll",
  category: "utility",
  aliases: ["vote"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !poll <question>");
    }

    const question = args.join(" ");
    const embed = new EmbedBuilder()
      .setTitle("📊 Poll")
      .setDescription(question)
      .setColor(0x3498db)
      .setFooter({ text: `Poll by ${interaction.author.tag}` })
      .setTimestamp();

    const pollMessage = await interaction.channel.send({ embeds: [embed] });
    await pollMessage.react("👍");
    await pollMessage.react("👎");
    await pollMessage.react("🤷");
    
    await interaction.delete().catch(() => {});
  }
} as DiscordCommand;
