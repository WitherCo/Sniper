import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "rps",
  description: "Play Rock Paper Scissors against the bot",
  category: "fun",
  aliases: ["rockpaperscissors"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    // Create buttons for Rock, Paper, Scissors
    const rockButton = new ButtonBuilder()
      .setCustomId("rps-rock")
      .setLabel("Rock")
      .setEmoji("🪨")
      .setStyle(ButtonStyle.Primary);

    const paperButton = new ButtonBuilder()
      .setCustomId("rps-paper")
      .setLabel("Paper")
      .setEmoji("📄")
      .setStyle(ButtonStyle.Primary);

    const scissorsButton = new ButtonBuilder()
      .setCustomId("rps-scissors")
      .setLabel("Scissors")
      .setEmoji("✂️")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(rockButton, paperButton, scissorsButton);

    // Create initial embed
    const embed = new EmbedBuilder()
      .setTitle("Rock Paper Scissors")
      .setDescription("Choose your move!")
      .setColor(0x3498DB)
      .setFooter({
        text: `Game started by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
      })
      .setTimestamp();

    // Send the initial message with buttons
    const response = await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      fetchReply: true
    });

    // Create a filter for the collector
    const filter = (i: any) => {
      return i.customId.startsWith('rps-') && 
        (interaction instanceof CommandInteraction 
          ? i.user.id === interaction.user.id 
          : i.user.id === interaction.author.id);
    };

    // Create a collector
    const collector = response.createMessageComponentCollector({ 
      filter, 
      time: 30000, 
      componentType: ComponentType.Button,
      max: 1
    });

    collector.on('collect', async (i) => {
      // Get player choice
      const playerChoice = i.customId.replace('rps-', '');
      
      // Get bot choice
      const choices = ['rock', 'paper', 'scissors'];
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      
      // Determine winner
      const result = determineWinner(playerChoice, botChoice);
      
      // Create updated embed
      const resultEmbed = new EmbedBuilder()
        .setTitle("Rock Paper Scissors - Result")
        .addFields(
          { name: "Your Choice", value: `${getEmoji(playerChoice)} ${capitalize(playerChoice)}`, inline: true },
          { name: "Bot's Choice", value: `${getEmoji(botChoice)} ${capitalize(botChoice)}`, inline: true },
          { name: "Result", value: getResultMessage(result), inline: false }
        )
        .setColor(getResultColor(result))
        .setFooter({
          text: `Game played by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
        })
        .setTimestamp();
      
      // Update the message with the result
      await i.update({ 
        embeds: [resultEmbed], 
        components: [] 
      });
    });

    collector.on('end', async (collected) => {
      // If no interaction was collected, timeout
      if (collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("Rock Paper Scissors - Timeout")
          .setDescription("Game timed out! You took too long to make a choice.")
          .setColor(0xE74C3C)
          .setFooter({
            text: `Game started by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
          })
          .setTimestamp();
        
        if (interaction instanceof CommandInteraction) {
          await interaction.editReply({ 
            embeds: [timeoutEmbed], 
            components: [] 
          }).catch(() => {});
        } else {
          // Try to edit the original message
          try {
            const msg = await response.fetch();
            await msg.edit({
              embeds: [timeoutEmbed],
              components: []
            }).catch(() => {});
          } catch (error) {
            // If we can't edit it, don't do anything
          }
        }
      }
    });
  }
} as DiscordCommand;

/**
 * Determine winner of RPS game
 */
function determineWinner(playerChoice: string, botChoice: string): "win" | "lose" | "tie" {
  if (playerChoice === botChoice) {
    return "tie";
  }
  
  if (
    (playerChoice === "rock" && botChoice === "scissors") ||
    (playerChoice === "paper" && botChoice === "rock") ||
    (playerChoice === "scissors" && botChoice === "paper")
  ) {
    return "win";
  }
  
  return "lose";
}

/**
 * Get result message based on result
 */
function getResultMessage(result: "win" | "lose" | "tie"): string {
  switch (result) {
    case "win":
      return "🎉 You win!";
    case "lose":
      return "😔 You lose!";
    case "tie":
      return "🤝 It's a tie!";
    default:
      return "Unknown result";
  }
}

/**
 * Get color based on result
 */
function getResultColor(result: "win" | "lose" | "tie"): number {
  switch (result) {
    case "win":
      return 0x2ECC71; // Green
    case "lose":
      return 0xE74C3C; // Red
    case "tie":
      return 0xF1C40F; // Yellow
    default:
      return 0x3498DB; // Blue
  }
}

/**
 * Get emoji for choice
 */
function getEmoji(choice: string): string {
  switch (choice) {
    case "rock":
      return "🪨";
    case "paper":
      return "📄";
    case "scissors":
      return "✂️";
    default:
      return "❓";
  }
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}