import { Message, EmbedBuilder, version as discordJsVersion } from 'discord.js';
import { config } from '../../config';

export default {
    name: 'about',
    description: 'Display information about the bot',
    category: 'information',
    prefix: true,
    cooldown: 10,
    
    async execute(message: Message) {
        try {
            // Get basic bot information
            const client = message.client;
            const botUser = client.user;
            
            // Calculate uptime
            const uptime = formatUptime(client.uptime || 0);
            
            // Create a rich embed
            const embed = new EmbedBuilder()
                .setColor(0x3498db)
                .setAuthor({ 
                    name: botUser?.username || 'Bot Information', 
                    iconURL: botUser?.displayAvatarURL() 
                })
                .setTitle('Bot Information')
                .setDescription('A feature-rich Discord bot for your server')
                .addFields(
                    { name: '👑 Creator', value: 'Lifeless rose', inline: true },
                    { name: '🤖 Bot Name', value: botUser?.username || 'Unknown', inline: true },
                    { name: '🆔 Bot ID', value: botUser?.id || 'Unknown', inline: true },
                    { name: '🏠 Servers', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '⏱️ Uptime', value: uptime, inline: true },
                    { name: '⚙️ Discord.js', value: `v${discordJsVersion}`, inline: true },
                    { name: '📟 Node.js', value: `${process.version}`, inline: true },
                    { name: '📋 Commands', value: `${client.commands.size}`, inline: true },
                    { name: '🛡️ Prefix', value: `\`${config.prefix}\``, inline: true }
                )
                .addFields({ 
                    name: 'Links', 
                    value: `[Discord Support](https://discord.gg/yoursupport) • [Documentation](https://yourbot-docs.com)`
                })
                .setFooter({ 
                    text: `Created by Lifeless rose • Use ${config.prefix}help for commands` 
                })
                .setTimestamp();
            
            // Send the embed
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[ABOUT COMMAND ERROR]', error);
            return message.reply('❌ An error occurred while getting bot information.');
        }
    }
};

// Helper function to format uptime
function formatUptime(uptime: number): string {
    const seconds = Math.floor(uptime / 1000) % 60;
    const minutes = Math.floor(uptime / (1000 * 60)) % 60;
    const hours = Math.floor(uptime / (1000 * 60 * 60)) % 24;
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    
    const parts = [];
    
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    
    return parts.join(' ') || '0s';
}