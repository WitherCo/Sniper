import dbCommand from './server/discord/commands/admin/db';
import { Client, Message } from 'discord.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Mock message object with proper discord.js like behavior
const createMockMessage = (content: string) => {
    // Parse and set up the args similar to how discord.js would
    const mockMessage = {
        author: { id: process.env.OWNER_ID || '123456789' },
        content,
        
        // Store replies for inspection
        replies: [] as any[],
        
        // Handling replies
        reply: function(content: any) {
            console.log('Reply:', JSON.stringify(content, null, 2));
            this.replies.push(content);
            return this; // For chaining
        },
        
        // Add channel properties
        channel: {
            send: (content: any) => {
                console.log('Channel send:', JSON.stringify(content, null, 2));
                return Promise.resolve({} as any);
            }
        }
    };
    
    return mockMessage as unknown as Message;
};

// Function to parse content into args similar to how messageCreate handler does
const parseArgsFromContent = (content: string): string[] => {
    // Extract prefix pattern
    const prefix = 'l?';
    if (!content.startsWith(prefix)) return [];
    
    // Parse args like messageCreate.ts does
    // The pattern is:
    // In messageCreate.ts:
    // 1. content.slice(prefix.length).trim().split(/ +/);
    // 2. commandName = args.shift()?.toLowerCase(); (so 'db' is removed)
    const fullArgs = content.slice(prefix.length).trim().split(/ +/);
    
    // Remove the command name (db) from args since that's what messageCreate does
    if (fullArgs.length > 0 && fullArgs[0] === 'db') {
        fullArgs.shift();
    }
    
    console.log(`[TEST] Parsed args from content: ${JSON.stringify(fullArgs)}`);
    return fullArgs;
};

// Test function
async function testDbCommand() {
    try {
        console.log('Testing db command...');
        
        // Set up environment for testing
        process.env.PREFIX = 'l?';
        process.env.OWNER_ID = '123456789';
        
        // Test help command
        console.log('\n--- Testing help command ---');
        const helpMessage = createMockMessage('l?db');
        const helpArgs = parseArgsFromContent(helpMessage.content);
        await dbCommand.execute(helpMessage, helpArgs);
        
        // Test specifically the format from the screenshot
        console.log('\n--- Testing command format from screenshot ---');
        const screenshotMessage = createMockMessage('l?db guild 1364733495397585056');
        console.log(`Command with content: ${screenshotMessage.content}`);
        const screenshotArgs = parseArgsFromContent(screenshotMessage.content);
        await dbCommand.execute(screenshotMessage, screenshotArgs);
        
        // For the other tests, let's log more info about what's happening
        console.log('\n--- Testing guild command (with space after prefix) ---');
        const guildMessage = createMockMessage('l?db guild 123456789');
        console.log(`Command with content: ${guildMessage.content}`);
        const guildArgs = parseArgsFromContent(guildMessage.content);
        await dbCommand.execute(guildMessage, guildArgs);
        
        console.log('\n--- Testing guild command (no space after prefix) ---');
        const guildMessageNoSpace = createMockMessage('l?db guild 1364733495397585056');
        console.log(`Command with content: ${guildMessageNoSpace.content}`);
        const guildNoSpaceArgs = parseArgsFromContent(guildMessageNoSpace.content);
        await dbCommand.execute(guildMessageNoSpace, guildNoSpaceArgs);
        
        console.log('\n--- Testing setting command ---');
        const settingMessage = createMockMessage('l?db setting 123456789 config');
        console.log(`Command with content: ${settingMessage.content}`);
        const settingArgs = parseArgsFromContent(settingMessage.content);
        await dbCommand.execute(settingMessage, settingArgs);
        
        console.log('\nAll tests completed successfully');
    } catch (error) {
        console.error('Error testing db command:', error);
    }
}

// Run the test
testDbCommand();