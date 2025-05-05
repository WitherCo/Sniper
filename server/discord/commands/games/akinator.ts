import { CommandInteraction, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const questions = [
  "Is your character real?",
  "Is your character male?",
  "Is your character a YouTuber?",
  "Is your character a musician?",
  "Is your character an actor?",
  "Is your character from a video game?",
  "Is your character from an anime?",
  "Is your character a politician?",
  "Is your character still alive?",
  "Is your character American?"
];

export default {
  name: "akinator",
  description: "Play Akinator - I'll try to guess the character you're thinking of",
  category: "games",
  aliases: ["aki"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    let questionIndex = 0;
    let points = 0;

    const embed = new EmbedBuilder()
      .setTitle("🧞‍♂️ Akinator")
      .setDescription(questions[questionIndex])
      .setColor(0x9B59B6)
      .setFooter({ text: `Question ${questionIndex + 1}/${questions.length}` });

    const yesButton = new ButtonBuilder()
      .setCustomId('yes')
      .setLabel('Yes')
      .setStyle(ButtonStyle.Success);

    const noButton = new ButtonBuilder()
      .setCustomId('no')
      .setLabel('No')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(yesButton, noButton);

    const message = await interaction.reply({ embeds: [embed], components: [row] });

    const collector = message.createMessageComponentCollector({
      time: 60000 * 2 // 2 minutes
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.author.id) {
        return i.reply({ content: "This is not your game!", ephemeral: true });
      }

      if (i.customId === 'yes') points += 1;
      questionIndex++;

      if (questionIndex < questions.length) {
        embed.setDescription(questions[questionIndex])
          .setFooter({ text: `Question ${questionIndex + 1}/${questions.length}` });
        await i.update({ embeds: [embed], components: [row] });
      } else {
        let guess = "";
        if (points >= 7) {
          guess = "I think it's a real, famous person, possibly a celebrity!";
        } else if (points >= 5) {
          guess = "I think it's a fictional character, maybe from entertainment media!";
        } else if (points >= 3) {
          guess = "I think it's a historical figure or someone from the past!";
        } else {
          guess = "I think it's a fictional character from literature or mythology!";
        }
        
        embed.setDescription(`Based on your answers...\n\n${guess}`)
          .setFooter({ text: "Game Over!" });
        await i.update({ embeds: [embed], components: [] });
        collector.stop();
      }
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        embed.setDescription('Game ended due to inactivity!')
          .setFooter({ text: "Timed Out!" });
        message.edit({ embeds: [embed], components: [] });
      }
    });
  }
} as DiscordCommand;
