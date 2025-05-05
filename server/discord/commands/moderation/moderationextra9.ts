import { Client, Message, GuildMember, Role } from 'discord.js';
import { DiscordCommand } from "@shared/schema";

interface GuildVerificationConfig {
    roleId?: string;
}

const verificationConfig = new Map<string, GuildVerificationConfig>();

export default {
    name: "verify",
    description: "Verifies a user and grants them the specified role.  Use `l?verify setup <roleName>` to set the verification role.",
    category: "moderation",
    aliases: ["verification"],
    slash: false,
    prefix: true,
    cooldown: 3,
    permissions: ["ManageRoles"],
    async execute(client: Client, message: Message) {
        if (message instanceof Message) {
            const args = message.content.split(' ').slice(1);
            const subCommand = args[0];

            if (subCommand === 'setup') {
                await handleSetup(message, args);
            } else {
                await handleVerify(message);
            }
        } else {
            await message.reply({ content: "This command is for prefix commands only.", ephemeral: true });
        }
    }
} as DiscordCommand;

async function handleSetup(message: Message, args: string[]) {
    const { guild } = message;

    if (!guild) {
        await message.reply('This command can only be used in a server.');
        return;
    }

    if (!message.member?.permissions.has('ManageRoles')) {
        await message.reply('You do not have permission to use this command.');
        return;
    }

    const roleName = args.slice(1).join(' ');

    if (!roleName) {
        await message.reply('Please specify the name of the role to use for verification.');
        return;
    }

    let verificationRole: Role | undefined;
    try {
        verificationRole = await guild.roles.cache.find(role => role.name === roleName);
    } catch (error) {
        console.error('Error finding role:', error);
        await message.reply('An error occurred while trying to find the role.');
        return;
    }

    if (!verificationRole) {
        await message.reply(`The role "${roleName}" does not exist. Please create this role and try again.`);
        return;
    }

    verificationConfig.set(guild.id, { roleId: verificationRole.id });
    await message.reply(`Verification role set to "${verificationRole.name}".`);
}

async function handleVerify(message: Message) {
    const { guild, member } = message;

    if (!guild) {
        await message.reply('This command can only be used in a server.');
        return;
    }

    if (!member) {
        await message.reply('Could not resolve member.');
        return;
    }

    const config = verificationConfig.get(guild.id);
    if (!config || !config.roleId) {
        await message.reply('Please set up a verification role using `l?verify setup <roleName>` first.');
        return;
    }

    const verificationRole = await guild.roles.cache.get(config.roleId);
    if (!verificationRole) {
        await message.reply('The verification role has not been set up correctly.  Please set it up again.');
        verificationConfig.delete(guild.id); // Clear the invalid config
        return;
    }

     if ((member as GuildMember).roles.cache.has(verificationRole.id)) {
        return message.reply("You are already verified!");
    }

    try {
        await (member as GuildMember).roles.add(verificationRole);
        await message.reply(
            `You have been verified and the "${verificationRole.name}" role has been added to your account.`
        );
    } catch (error) {
        console.error('Error assigning role:', error);
        await message.reply(
            'There was an error assigning the role.  Please make sure the bot has the correct permissions and try again.'
        );
    }
}
