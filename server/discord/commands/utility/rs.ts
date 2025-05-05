import { Client, Message, Guild } from 'discord.js';
import { DiscordCommand } from "@shared/schema";

export default {
    name: "rs", // Changed command name to "rs"
    description: "Displays server information, including boosts, admins, and mods.",
    category: "utility",
    aliases: ["server"],
    slash: false,
    prefix: true,
    cooldown: 5,
    permissions: [],
    async execute(client: Client, message: Message) {
        if (message instanceof Message) {
            const guild: Guild | null = message.guild;

            if (!guild) {
                await message.channel.send("This command can only be used in a server.");
                return;
            }

            const boosts = guild.premiumSubscriptionCount || 0;

            // Get administrator and moderator roles
            const adminRole = guild.roles.cache.find(role => role.permissions.has("Administrator"));
            const modRole = guild.roles.cache.find(role => role.permissions.has("ManageMessages"));

            // Get members in those roles
            const admins = adminRole
                ? guild.members.cache
                    .filter(member => member.roles.cache.has(adminRole.id))
                    .map(m => `<@${m.id}>`)
                    .join(', ') || 'No Admins'
                : 'No Admins';
            const mods = modRole
                ? guild.members.cache
                    .filter(member => member.roles.cache.has(modRole.id))
                    .map(m => `<@${m.id}>`)
                    .join(', ') || 'No Mods'
                : 'No Mods';

            const embed = {
                color: 0x3498db,
                title: "Server Information",
                description: `
**Boost Level:** ${guild.premiumTier || 'None'}
**Boosts:** ${boosts}
**Administrators:** ${admins}
**Moderators:** ${mods}
                `,
                footer: {
                    text: "Powered by Lifeless Rose",
                },
            };

            await message.channel.send({ embeds: [embed] });
        } else {
            await message.reply({ content: "This command is for prefix commands only.", ephemeral: true });
        }
    }
} as DiscordCommand;
