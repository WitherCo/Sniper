
import { CommandInteraction, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const categories = [
  { name: "General Knowledge", questions: [
    { q: "What is the capital of France?", a: "Paris" },
    { q: "Which planet is known as the Red Planet?", a: "Mars" },
    { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci" }
  ]},
  { name: "Science", questions: [
    { q: "What is the chemical symbol for Gold?", a: "Au" },
    { q: "What is the hardest natural substance on Earth?", a: "Diamond" },
    { q: "What is the largest organ in the human body?", a: "Skin" }
  ]},
  { name: "Gaming", questions: [
    { q: "Which company created Mario?", a: "Nintendo" },
    { q: "What is the best-selling video game of all time?", a: "Minecraft" },
    { q: "In what year was Discord first released?", a: "2015" }
  ]}
];

export default {
  name: "trivia",
  description: "Play a trivia game with various categories",
  category: "games",
  aliases: ["quiz"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const category = categories[Math.floor(Math.random() * categories.length)];
    const question = category.questions[Math.floor(Math.random() * category.questions.length)];
    
    const embed = new EmbedBuilder()
      .setTitle("🎯 Trivia Time")
      .setDescription(`**Category:** ${category.name}\n\n**Question:** ${question.q}`)
      .setColor(0x3498DB)
      .setFooter({ text: "You have 30 seconds to answer!" });

    // Generate 4 options including the correct answer
    const options = [question.a];
    const otherQuestions = categories.flatMap(c => c.questions.map(q => q.a))
      .filter(a => a !== question.a);
    
    while (options.length < 4) {
      const randomAnswer = otherQuestions[Math.floor(Math.random() * otherQuestions.length)];
      if (!options.includes(randomAnswer)) {
        options.push(randomAnswer);
      }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);

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
      const correct = selectedOption === question.a;

      embed.setDescription(`**Category:** ${category.name}\n\n**Question:** ${question.q}\n\n${correct ? "✅ Correct!" : "❌ Wrong!"}\nThe answer was: ${question.a}`)
        .setColor(correct ? 0x2ECC71 : 0xE74C3C);

      await i.update({ embeds: [embed], components: [] });
      collector.stop();
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        embed.setDescription(`**Category:** ${category.name}\n\n**Question:** ${question.q}\n\n⏰ Time's up!\nThe answer was: ${question.a}`)
          .setColor(0xE74C3C);
        message.edit({ embeds: [embed], components: [] });
      }
    });
  }
} as DiscordCommand;
