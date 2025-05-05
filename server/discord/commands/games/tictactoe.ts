
import { CommandInteraction, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
];

export default {
  name: "tictactoe",
  description: "Play tic-tac-toe against another user",
  category: "games",
  aliases: ["ttt"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const opponent = interaction.mentions.users.first();
    if (!opponent) {
      return interaction.reply("Please mention a user to play against");
    }

    if (opponent.bot) {
      return interaction.reply("You cannot play against a bot");
    }

    if (opponent.id === interaction.author.id) {
      return interaction.reply("You cannot play against yourself");
    }

    const board = Array(9).fill(null);
    let currentPlayer = interaction.author.id;

    const buttons = board.map((_, i) => 
      new ButtonBuilder()
        .setCustomId(`ttt_${i}`)
        .setLabel(" ")
        .setStyle(ButtonStyle.Secondary)
    );

    const rows = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(0, 3)),
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(3, 6)),
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(6, 9))
    ];

    const embed = new EmbedBuilder()
      .setTitle("Tic Tac Toe")
      .setDescription(`Current turn: ${currentPlayer === interaction.author.id ? interaction.author.tag : opponent.tag}`)
      .setColor(0x3498db);

    const gameMessage = await interaction.reply({ embeds: [embed], components: rows });

    // Game collector
    const collector = gameMessage.createMessageComponentCollector({
      filter: i => i.user.id === currentPlayer,
      time: 300000 // 5 minutes
    });

    collector.on("collect", async (i) => {
      const position = parseInt(i.customId.split("_")[1]);
      
      if (board[position]) {
        return i.reply({ content: "That position is already taken!", ephemeral: true });
      }

      board[position] = currentPlayer === interaction.author.id ? "X" : "O";
      buttons[position]
        .setLabel(board[position])
        .setStyle(currentPlayer === interaction.author.id ? ButtonStyle.Primary : ButtonStyle.Danger)
        .setDisabled(true);

      const winner = checkWinner(board);
      if (winner) {
        collector.stop("win");
        const winnerUser = winner === "X" ? interaction.author : opponent;
        embed.setDescription(`Winner: ${winnerUser.tag}! 🎉`);
        return await i.update({ embeds: [embed], components: rows });
      }

      if (!board.includes(null)) {
        collector.stop("draw");
        embed.setDescription("Game ended in a draw!");
        return await i.update({ embeds: [embed], components: rows });
      }

      currentPlayer = currentPlayer === interaction.author.id ? opponent.id : interaction.author.id;
      embed.setDescription(`Current turn: ${currentPlayer === interaction.author.id ? interaction.author.tag : opponent.tag}`);
      await i.update({ embeds: [embed], components: rows });
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") {
        embed.setDescription("Game ended due to inactivity");
        gameMessage.edit({ embeds: [embed], components: [] });
      }
    });
  }
} as DiscordCommand;

function checkWinner(board: (string | null)[]): string | null {
  for (const [a, b, c] of winConditions) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}
