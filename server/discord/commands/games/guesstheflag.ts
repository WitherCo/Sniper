import { CommandInteraction, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const flags = [
  { emoji: "🇺🇸", country: "United States" },
  { emoji: "🇬🇧", country: "United Kingdom" },
  { emoji: "🇫🇷", country: "France" },
  { emoji: "🇩🇪", country: "Germany" },
  { emoji: "🇮🇹", country: "Italy" },
  { emoji: "🇯🇵", country: "Japan" },
  { emoji: "🇨🇦", country: "Canada" },
  { emoji: "🇦🇺", country: "Australia" },
  { emoji: "🇧🇷", country: "Brazil" },
  { emoji: "🇲🇽", country: "Mexico" }
];

export default {
  name: "guesstheflag",
  description: "Test your knowledge of country flags",
  category: "games",
  aliases: ["flags"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const currentFlag = flags[Math.floor(Math.random() * flags.length)];
    const options = [currentFlag.country];

    // Add 3 random wrong options
    while (options.length < 4) {
      const randomFlag = flags[Math.floor(Math.random() * flags.length)];
      if (!options.includes(randomFlag.country)) {
        options.push(randomFlag.country);
      }
    }

    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    const embed = new EmbedBuilder()
      .setTitle("🎯 Guess The Flag")
      .setDescription(`Which country does this flag belong to?\n\n${currentFlag.emoji}`)
      .setColor(0x3498DB)
      .setFooter({ text: "You have 30 seconds to answer!" });

    const buttons = options.map((option, index) => 
      new ButtonBuilder()
        .setCustomId(`option_${index}`)
        .setLabel(option)
        .setStyle(ButtonStyle.Primary)
    );

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(buttons);

    const message = await interaction.reply({ embeds: [embed], components: [row] });

    const collector = message.createMessageComponentCollector({
      time: 30000
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.author.id) {
        return i.reply({ content: "This is not your game!", ephemeral: true });
      }

      const selectedOption = options[parseInt(i.customId.split('_')[1])];
      const correct = selectedOption === currentFlag.country;

      embed.setDescription(`${currentFlag.emoji}\n\n${correct ? "✅ Correct!" : "❌ Wrong!"}\nThe answer was: ${currentFlag.country}`)
        .setColor(correct ? 0x2ECC71 : 0xE74C3C);

      await i.update({ embeds: [embed], components: [] });
      collector.stop();
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        embed.setDescription(`${currentFlag.emoji}\n\n⏰ Time's up!\nThe answer was: ${currentFlag.country}`)
          .setColor(0xE74C3C);
        message.edit({ embeds: [embed], components: [] });
      }
    });
  }
} as DiscordCommand;