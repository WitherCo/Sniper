import { Message, CommandInteraction, User } from "discord.js";
import { config } from "../config";

/**
 * Check if a user is the bot owner
 * @param user Discord user to check
 * @returns Boolean indicating if the user is the bot owner
 */
export function isOwner(user: User): boolean {
  return user.id === config.ownerId;
}

/**
 * Check if a command is restricted to the bot owner
 * @param commandName Name of the command to check
 * @returns Boolean indicating if the command is restricted to the owner
 */
export function isOwnerCommand(commandName: string): boolean {
  return config.ownerOnlyCommands.includes(commandName.toLowerCase());
}

/**
 * Check if a command is considered dangerous and might require confirmation
 * @param commandName Name of the command to check
 * @returns Boolean indicating if the command is dangerous
 */
export function isDangerousCommand(commandName: string): boolean {
  return config.dangerousCommands.includes(commandName.toLowerCase());
}

/**
 * Handle owner-only command verification
 * Automatically checks if the command is owner-only and if the user is the owner
 * 
 * @param interaction Message or interaction that triggered the command
 * @param commandName Name of the command being executed
 * @returns Boolean indicating if execution should continue (true) or stop (false)
 */
export async function handleOwnerOnlyCommand(
  interaction: Message | CommandInteraction,
  commandName: string
): Promise<boolean> {
  // Check if this is an owner-only command
  if (!isOwnerCommand(commandName)) {
    return true; // Not an owner-only command, continue execution
  }
  
  // Get the user who triggered the command
  const user = interaction instanceof Message ? interaction.author : interaction.user;
  
  // Check if the user is the bot owner
  if (!isOwner(user)) {
    const errorMsg = `❌ The \`${commandName}\` command can only be used by the bot owner.`;
    
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply(errorMsg);
    }
    
    return false; // Stop command execution
  }
  
  return true; // User is the owner, continue execution
}