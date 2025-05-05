import { Message, CommandInteraction, PermissionsBitField, GuildMember } from "discord.js";
import { config } from "../config";

/**
 * Check if a user has the required permissions to use a command
 */
export async function checkPermissions(
  context: Message | CommandInteraction,
  requiredPermissions: string[]
): Promise<boolean> {
  const contextType = context instanceof Message ? "message" : "interaction";
  console.log(`[DEBUG] Checking permissions for ${contextType} with required permissions: ${requiredPermissions.join(', ')}`);
  
  // Owner bypass
  const userId = context instanceof Message 
    ? context.author.id 
    : context.user.id;
  console.log(`[DEBUG] User ID: ${userId}, Owner ID: ${config.ownerId}`);
  
  if (userId === config.ownerId) {
    console.log(`[DEBUG] Owner bypass - permission check passed`);
    return true;
  }
  
  // Check if in DMs (no permissions in DMs)
  if (!context.guild) {
    console.log(`[DEBUG] In DMs - ${requiredPermissions.length === 0 ? 'permission check passed' : 'permission check failed'}`);
    return requiredPermissions.length === 0;
  }
  
  // Get member
  const member = context.member as GuildMember;
  if (!member) {
    console.log(`[DEBUG] No member found - permission check failed`);
    return false;
  }
  
  console.log(`[DEBUG] Checking permissions for member: ${member.user.tag} (${member.id})`);
  
  // Administrator permission bypass
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    console.log(`[DEBUG] Administrator bypass - permission check passed`);
    return true;
  }
  
  // Check each required permission
  for (const perm of requiredPermissions) {
    const permission = perm as keyof typeof PermissionsBitField.Flags;
    console.log(`[DEBUG] Checking permission: ${permission}`);
    
    try {
      const permFlag = PermissionsBitField.Flags[permission];
      const hasPerm = member.permissions.has(permFlag);
      console.log(`[DEBUG] Permission ${permission}: ${hasPerm ? 'has permission' : 'missing permission'}`);
      
      if (!hasPerm) {
        console.log(`[DEBUG] Permission check failed due to missing: ${permission}`);
        return false;
      }
    } catch (error) {
      console.error(`[ERROR] Invalid permission flag: ${permission}`, error);
      return false;
    }
  }
  
  console.log(`[DEBUG] All permissions check passed`);
  return true;
}
