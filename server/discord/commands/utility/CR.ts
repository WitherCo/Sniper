import { CommandInteraction, Message } from 'discord.js';
import { DiscordCommand } from "@shared/schema";

export default {
    name: "cr",
    description: "Sends a copyright notice.",
    category: "utility",
    aliases: ["copy"],
    slash: false,
    prefix: true,
    cooldown: 5,
    permissions: [], // No specific permissions required
    async execute(interaction: CommandInteraction | Message) {
        if (interaction instanceof Message) {
            const embed = {
                color: 0x3498db,
                title: "© Copyright Notice",
                description: `
Copyright © ${new Date().getFullYear()} WitherCo. All rights reserved.

This material, including but not limited to text, images, code, and design, is protected by copyright law and international treaties. Unauthorized reproduction, display, modification, distribution, or transmission of this material, in whole or in part, is strictly prohibited.

This includes, but is not limited to:
- Copying the content and pasting it elsewhere.
- Distributing the content to others, whether for commercial or non-commercial purposes.
- Modifying the content and claiming it as your own, or implying endorsement by WitherCo.
- Using the content for commercial purposes without explicit prior written permission.
- Creating derivative works based on the content.
- Publicly displaying the content without attribution.
- Removing or altering any copyright notices or watermarks.

Requests for permission to reproduce or distribute this material should be directed to WitherCo through appropriate channels.

By accessing and using this material, you agree to abide by these terms.
                `,
                footer: {
                    text: "Powered by Lifeless Rose",
                },
            };
            await interaction.channel.send({ embeds: [embed] });
        } else {
            await interaction.reply({ content: "This command is for prefix commands only.", ephemeral: true });
        }
    }
} as DiscordCommand;
