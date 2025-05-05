import { Message, EmbedBuilder } from 'discord.js';
import { storage } from '../../../../server/storage';
import { config } from '../../config';

export default {
    name: 'db',
    description: 'Debug command for bot owner',
    category: 'admin',
    permissions: ['Administrator'],
    prefix: true,
    
    async execute(message: Message, args: string[]) {
        // Check if user is owner
        if (message.author.id !== config.ownerId && message.author.id !== process.env.OWNER_ID) {
            return message.reply('This command is only for the bot owner.');
        }
        
        // Extract command parameters from message content directly
        // This bypasses any prefix or command parsing issues
        const content = message.content;
        
        // Simple regex patterns to extract data regardless of spacing
        const guildMatch = content.match(/guild\s+(\d+)/i);
        const settingMatch = content.match(/setting\s+(\d+)\s+(\w+)/i);
        
        // Create embed builder
        const embed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTimestamp();
        
        try {
            // Handle Guild data command
            if (guildMatch && guildMatch[1]) {
                const guildId = guildMatch[1];
                const guildData = await getGuildData(guildId);
                
                embed
                    .setTitle('Guild Data')
                    .setDescription(`\`\`\`json\n${JSON.stringify(guildData, null, 2)}\n\`\`\``);
                
                return message.reply({ embeds: [embed] });
            }
            
            // Handle Setting command
            else if (settingMatch && settingMatch[1] && settingMatch[2]) {
                const guildId = settingMatch[1];
                const setting = settingMatch[2];
                
                const settingData = await getGuildSetting(guildId, setting);
                
                embed
                    .setTitle(`Guild Setting: ${setting}`)
                    .setDescription(`\`\`\`json\n${JSON.stringify(settingData, null, 2)}\n\`\`\``);
                
                return message.reply({ embeds: [embed] });
            }
            
            // Default help message
            else {
                const prefix = config.prefix;
                embed
                    .setTitle('DB Command Help')
                    .setDescription(
                        `Available subcommands:
                        
                        \`${prefix}db guild <guildId>\` - Get guild data
                        \`${prefix}db setting <guildId> <setting>\` - Get guild setting
                        
                        Available settings: botban, config, commands, categories`
                    );
                
                return message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('[DB ERROR]', error);
            return message.reply('An error occurred while processing the command.');
        }
    }
};

// Get guild data from server ban status
async function getGuildData(guildId: string) {
    try {
        // Get server ban status if any
        const serverBan = await storage.getServerBan(guildId);
        
        // Get bot configuration
        const botConfig = await storage.getBotConfig();
        
        // Return combined data
        return {
            id: guildId,
            banned: serverBan ? true : false,
            banReason: serverBan?.reason || null,
            bannedAt: serverBan?.bannedAt || null,
            bannedBy: serverBan?.bannedBy || null,
            botPrefix: botConfig?.prefix || config.prefix,
        };
    } catch (error) {
        console.error("Error fetching guild data:", error);
        return { id: guildId, error: "Failed to fetch guild data" };
    }
}

// Get a specific setting for a guild
async function getGuildSetting(guildId: string, setting: string) {
    try {
        if (setting === 'botban') {
            return await storage.getServerBan(guildId);
        } else if (setting === 'config') {
            return await storage.getBotConfig();
        } else if (setting === 'commands') {
            return await storage.getAllCommands();
        } else if (setting === 'categories') {
            return await storage.getAllCategories();
        } else {
            return { 
                id: guildId, 
                setting, 
                message: "Setting not found or not implemented"
            };
        }
    } catch (error) {
        console.error(`Error fetching setting ${setting}:`, error);
        return { id: guildId, setting, error: "Failed to fetch setting" };
    }
}