
import { CommandInteraction, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 6;

export default {
  name: "connect4",
  description: "Play Connect 4 against another user",
  category: "games",
  aliases: ["c4"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message) {
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

    const board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
    let currentPlayer = interaction.author.id;

    const buttons = Array(BOARD_WIDTH).fill(null).map((_, i) => 
      new ButtonBuilder()
        .setCustomId(`c4_${i}`)
        .setLabel(`${i + 1}`)
        .setStyle(ButtonStyle.Secondary)
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

    const embed = new EmbedBuilder()
      .setTitle("Connect 4")
      .setDescription(getBoardDisplay(board, interaction.author.id, opponent.id))
      .setColor(0x3498db)
      .setFooter({ text: `Current turn: ${currentPlayer === interaction.author.id ? interaction.author.tag : opponent.tag}` });

    const gameMessage = await interaction.reply({ embeds: [embed], components: [row] });

    const collector = gameMessage.createMessageComponentCollector({
      filter: i => i.user.id === currentPlayer,
      time: 300000
    });

    collector.on("collect", async (i) => {
      const column = parseInt(i.customId.split("_")[1]);
      const row = getLowestEmptyRow(board, column);

      if (row === -1) {
        return i.reply({ content: "That column is full!", ephemeral: true });
      }

      board[row][column] = currentPlayer;
      
      if (checkWin(board, row, column)) {
        collector.stop("win");
        embed.setDescription(getBoardDisplay(board, interaction.author.id, opponent.id))
          .setFooter({ text: `Winner: ${currentPlayer === interaction.author.id ? interaction.author.tag : opponent.tag}! 🎉` });
        return await i.update({ embeds: [embed], components: [] });
      }

      if (isBoardFull(board)) {
        collector.stop("draw");
        embed.setDescription(getBoardDisplay(board, interaction.author.id, opponent.id))
          .setFooter({ text: "Game ended in a draw!" });
        return await i.update({ embeds: [embed], components: [] });
      }

      currentPlayer = currentPlayer === interaction.author.id ? opponent.id : interaction.author.id;
      embed.setDescription(getBoardDisplay(board, interaction.author.id, opponent.id))
        .setFooter({ text: `Current turn: ${currentPlayer === interaction.author.id ? interaction.author.tag : opponent.tag}` });
      await i.update({ embeds: [embed], components: [row] });
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") {
        embed.setFooter({ text: "Game ended due to inactivity" });
        gameMessage.edit({ embeds: [embed], components: [] });
      }
    });
  }
} as DiscordCommand;

function getBoardDisplay(board: (string | null)[][], player1: string, player2: string): string {
  return board.map(row => 
    row.map(cell => {
      if (!cell) return "⚪";
      return cell === player1 ? "🔴" : "🟡";
    }).join("")
  ).join("\n");
}

function getLowestEmptyRow(board: (string | null)[][], column: number): number {
  for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
    if (!board[row][column]) return row;
  }
  return -1;
}

function checkWin(board: (string | null)[][], row: number, col: number): boolean {
  const directions = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal right
    [1, -1]  // Diagonal left
  ];

  const player = board[row][col];
  
  return directions.some(([dy, dx]) => {
    let count = 1;
    
    // Check in positive direction
    for (let i = 1; i < 4; i++) {
      const newRow = row + (dy * i);
      const newCol = col + (dx * i);
      if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== player) break;
      count++;
    }
    
    // Check in negative direction
    for (let i = 1; i < 4; i++) {
      const newRow = row - (dy * i);
      const newCol = col - (dx * i);
      if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== player) break;
      count++;
    }
    
    return count >= 4;
  });
}

function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH;
}

function isBoardFull(board: (string | null)[][]): boolean {
  return board[0].every(cell => cell !== null);
}
