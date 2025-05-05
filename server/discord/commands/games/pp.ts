import { CommandInteraction, Message } from 'discord.js';
import { DiscordCommand } from "@shared/schema";

// Helper function to generate a random "pp size" string
function generatePpSize(): string {
    const size = Math.floor(Math.random() * 15) + 1; // Size between 1 and 15
    let result = "8";
    for (let i = 0; i < size; i++) {
        result += "=";
    }
    result += "D";
    return result;
}

export default {
    name: "pp",
    description: "Displays your pp size.",
    category: "fun",
    aliases: ["pp", "size"],
    slash: false,
    prefix: true,
    cooldown: 5,
    permissions: [], // No specific permissions required
    async execute(interaction: CommandInteraction | Message) {
        if (interaction instanceof Message) {
            const size = generatePpSize();
            await interaction.channel.send(`${interaction.author}'s pp size:\n${size}`);
        } else {
            await interaction.reply({ content: "This command is for prefix commands only.", ephemeral: true });
        }
    }
} as DiscordCommand;
