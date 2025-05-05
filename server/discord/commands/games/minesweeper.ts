
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

function createMinesweeperBoard(size: number, mines: number): string {
  const board = Array(size).fill(null).map(() => Array(size).fill(0));
  let remainingMines = mines;

  // Place mines
  while (remainingMines > 0) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    if (board[y][x] !== '💣') {
      board[y][x] = '💣';
      remainingMines--;
    }
  }

  // Calculate numbers
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === '💣') continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < size && nx >= 0 && nx < size && board[ny][nx] === '💣') {
            count++;
          }
        }
      }
      board[y][x] = count === 0 ? '0️⃣' : count.toString() + '️⃣';
    }
  }

  // Convert to Discord spoiler format
  return board.map(row => 
    row.map(cell => `||${cell}||`).join('')
  ).join('\n');
}

export default {
  name: "minesweeper",
  description: "Play a game of Minesweeper",
  category: "games",
  aliases: ["mines"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const size = 8;
    const mines = 10;

    const embed = new EmbedBuilder()
      .setTitle("💣 Minesweeper")
      .setDescription("Click the spoilers to reveal tiles. Avoid the mines!\n\n" + 
        createMinesweeperBoard(size, mines))
      .setColor(0x808080)
      .setFooter({ text: `${mines} mines • ${size}x${size} board` });

    await interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
