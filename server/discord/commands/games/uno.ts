
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const colors = ['🔴', '🔵', '🟡', '🟢'];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

class UnoCard {
  constructor(public color: string, public value: string) {}
  toString() {
    return `${this.color}${this.value}`;
  }
}

function createDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  for (const color of colors) {
    for (const number of numbers) {
      deck.push(new UnoCard(color, number));
    }
  }
  return deck;
}

function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default {
  name: "uno",
  description: "Play a simplified version of UNO",
  category: "games",
  aliases: [],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    const deck = shuffleDeck(createDeck());
    const playerHand = deck.splice(0, 7);
    const topCard = deck.pop()!;

    const embed = new EmbedBuilder()
      .setTitle("🎴 UNO Game")
      .setDescription(`Top card: ${topCard.toString()}\n\nYour hand:\n${playerHand.map(card => card.toString()).join(' ')}`)
      .setFooter({ text: "Type a number to play that card from your hand, or 'draw' to draw a card" })
      .setColor(0xFF0000);

    await interaction.reply({ embeds: [embed] });

    const filter = (m: Message) => m.author.id === interaction.author.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

    collector.on("collect", (msg) => {
      if (msg.content.toLowerCase() === "draw") {
        if (deck.length > 0) {
          const newCard = deck.pop()!;
          playerHand.push(newCard);
          msg.reply(`You drew: ${newCard.toString()}\nYour hand: ${playerHand.map(card => card.toString()).join(' ')}`);
        } else {
          msg.reply("No more cards in the deck!");
          collector.stop();
        }
        return;
      }

      const cardIndex = parseInt(msg.content) - 1;
      if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= playerHand.length) {
        msg.reply("Invalid card number!");
        return;
      }

      const selectedCard = playerHand[cardIndex];
      if (selectedCard.color === topCard.color || selectedCard.value === topCard.value) {
        playerHand.splice(cardIndex, 1);
        msg.reply(`You played: ${selectedCard.toString()}\nYour hand: ${playerHand.map(card => card.toString()).join(' ')}`);
        
        if (playerHand.length === 0) {
          msg.reply("🎉 You won!");
          collector.stop();
        }
      } else {
        msg.reply("You can't play that card! It must match the color or number of the top card.");
      }
    });

    collector.on("end", () => {
      interaction.channel.send("Game ended!");
    });
  }
} as DiscordCommand;
