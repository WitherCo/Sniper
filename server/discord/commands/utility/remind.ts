
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "remind",
  description: "Set a reminder",
  category: "utility",
  aliases: ["reminder", "remindme"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !remind <time> <reminder>\nExample: !remind 1h Check email");
    }

    const timeArg = args[0].toLowerCase();
    const reminder = args.slice(1).join(" ");
    
    let ms = 0;
    if (timeArg.endsWith('s')) ms = parseInt(timeArg) * 1000;
    else if (timeArg.endsWith('m')) ms = parseInt(timeArg) * 60000;
    else if (timeArg.endsWith('h')) ms = parseInt(timeArg) * 3600000;
    else if (timeArg.endsWith('d')) ms = parseInt(timeArg) * 86400000;
    else return interaction.reply("Invalid time format. Use: s (seconds), m (minutes), h (hours), d (days)");

    if (isNaN(ms) || ms <= 0) {
      return interaction.reply("Please provide a valid time");
    }

    if (ms > 2592000000) { // 30 days max
      return interaction.reply("Reminder can't be longer than 30 days");
    }

    const embed = new EmbedBuilder()
      .setTitle("⏰ Reminder Set")
      .setDescription(`I'll remind you about: ${reminder}`)
      .addFields([{ name: "Time", value: `In ${timeArg}` }])
      .setColor(0x2ecc71)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    setTimeout(async () => {
      const reminderEmbed = new EmbedBuilder()
        .setTitle("⏰ Reminder")
        .setDescription(reminder)
        .setColor(0x2ecc71)
        .setTimestamp();

      await interaction.author.send({ embeds: [reminderEmbed] })
        .catch(() => interaction.channel?.send({ content: `${interaction.author}`, embeds: [reminderEmbed] }));
    }, ms);
  }
} as DiscordCommand;
