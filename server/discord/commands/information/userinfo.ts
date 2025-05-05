import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  User,
  GuildMember,
  PermissionsBitField,
  UserFlags
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "userinfo",
  description: "Display information about a user",
  category: "information",
  aliases: ["user", "whois", "member"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "user",
      description: "The user to get information about (defaults to yourself)",
      type: "USER",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Check if we have a guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Get target user
    let targetUser: User | null = null;
    
    if (interaction instanceof CommandInteraction) {
      // Get mentionedUser from slash command
      const userOption = interaction.options.getUser("user");
      targetUser = userOption || interaction.user;
    } else {
      // Get mentionedUser from message command
      if (!args || args.length === 0) {
        // If no args, use message author
        targetUser = interaction.author;
      } else {
        const userArg = args[0];
        
        // Check if it's a mention
        const mentionMatch = userArg.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
          const userId = mentionMatch[1];
          try {
            targetUser = await interaction.client.users.fetch(userId);
          } catch (error) {
            return interaction.reply(`❌ Could not find a user with ID \`${userId}\`.`);
          }
        } 
        // Check if it's a raw ID
        else if (/^\d+$/.test(userArg)) {
          try {
            targetUser = await interaction.client.users.fetch(userArg);
          } catch (error) {
            return interaction.reply(`❌ Could not find a user with ID \`${userArg}\`.`);
          }
        } 
        // Try to find by username in server
        else {
          const members = await guild.members.fetch();
          const foundMember = members.find(m => 
            m.user.username.toLowerCase() === userArg.toLowerCase() || 
            (m.nickname && m.nickname.toLowerCase() === userArg.toLowerCase())
          );
          
          if (foundMember) {
            targetUser = foundMember.user;
          } else {
            return interaction.reply(`❌ Could not find a user named "${userArg}" in this server.`);
          }
        }
      }
    }
    
    if (!targetUser) {
      return interaction.reply("❌ Could not find the specified user.");
    }
    
    try {
      // Create and send user info embed
      const userInfoEmbed = await createUserInfoEmbed(targetUser, guild);
      
      return interaction.reply({ embeds: [userInfoEmbed] });
    } catch (error) {
      console.error("Error fetching user information:", error);
      return interaction.reply({
        content: "❌ An error occurred while fetching user information.",
        ephemeral: true
      });
    }
  }
} as DiscordCommand;

/**
 * Create a detailed embed with user information
 */
async function createUserInfoEmbed(user: User, guild: any): Promise<EmbedBuilder> {
  // Get the member object if the user is in the guild
  let member: GuildMember | null = null;
  try {
    member = await guild.members.fetch(user.id);
  } catch (error) {
    // User is not in the guild or couldn't be fetched
    console.log(`User ${user.tag} is not in the guild or couldn't be fetched`);
  }
  
  // Format timestamps
  const userCreatedTimestamp = Math.floor(user.createdTimestamp / 1000);
  const memberJoinedTimestamp = member ? Math.floor(member.joinedTimestamp! / 1000) : 0;
  
  // Calculate account age
  const accountAge = getTimeDifference(user.createdTimestamp);
  
  // Calculate server membership time
  const memberAge = member ? getTimeDifference(member.joinedTimestamp!) : "Not a member";
  
  // Get user badges
  const badges = user.flags ? getUserBadges(user.flags) : [];
  
  // Build the embed
  const embed = new EmbedBuilder()
    .setTitle(`User Information: ${user.bot ? '🤖 ' : ''}${user.tag}`)
    .setColor(member?.displayHexColor || 0x3498DB)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "User ID", value: user.id, inline: true },
      { name: "Username", value: `${user.username}` + (user.discriminator !== '0' ? `#${user.discriminator}` : ''), inline: true },
      { name: "Display Name", value: user.globalName || user.username, inline: true },
      { name: "Created Account", value: `<t:${userCreatedTimestamp}:F> (<t:${userCreatedTimestamp}:R>)`, inline: false },
      { name: "Account Age", value: accountAge, inline: true }
    );
  
  // Add member-specific information if available
  if (member) {
    // Add nickname if one exists
    if (member.nickname) {
      embed.addFields({ name: "Nickname", value: member.nickname, inline: true });
    }
    
    // Add joined server time
    embed.addFields(
      { name: "Joined Server", value: `<t:${memberJoinedTimestamp}:F> (<t:${memberJoinedTimestamp}:R>)`, inline: false },
      { name: "Member For", value: memberAge, inline: true }
    );
    
    // Add roles (up to 25 roles to prevent overflow)
    const roles = member.roles.cache
      .filter(role => role.id !== guild.id) // Filter out @everyone
      .sort((a, b) => b.position - a.position); // Sort by position
    
    if (roles.size > 0) {
      const rolesList = roles.size <= 25 
        ? roles.map(r => `${r}`).join(' ')
        : roles.first(25).map(r => `${r}`).join(' ') + ` ...and ${roles.size - 25} more`;
      
      embed.addFields({ name: `Roles [${roles.size}]`, value: rolesList || "No roles", inline: false });
    }
    
    // Add permissions
    if (member.permissions) {
      const keyPermissions = getKeyPermissions(member.permissions);
      
      if (keyPermissions.length > 0) {
        const formattedPermissions = keyPermissions.map(p => `\`${p}\``).join(', ');
        embed.addFields({ name: "Key Permissions", value: formattedPermissions, inline: false });
      }
    }
    
    // Add member acknowledgements
    const acknowledgements = getMemberAcknowledgements(member, guild);
    if (acknowledgements.length > 0) {
      embed.addFields({ name: "Acknowledgements", value: acknowledgements.join('\n'), inline: false });
    }
  }
  
  // Add user badges if any
  if (badges.length > 0) {
    embed.addFields({ name: "Badges", value: badges.join(', '), inline: false });
  }
  
  // Add banner if available
  if (user.banner) {
    try {
      const userWithBanner = await user.fetch();
      if (userWithBanner.bannerURL()) {
        embed.setImage(userWithBanner.bannerURL({ size: 512 }) || "");
      }
    } catch (error) {
      console.error("Error fetching user banner:", error);
    }
  }
  
  return embed;
}

/**
 * Calculate the time difference between a timestamp and now
 */
function getTimeDifference(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Convert to various units
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  // Format the result
  if (years > 0) {
    return `${years} year${years !== 1 ? 's' : ''}, ${months % 12} month${months % 12 !== 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months !== 1 ? 's' : ''}, ${days % 30} day${days % 30 !== 1 ? 's' : ''}`;
  } else if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`;
  }
}

/**
 * Get user badges from UserFlags
 */
function getUserBadges(flags: UserFlags): string[] {
  const badges: string[] = [];
  
  // Check for each badge
  if (flags.has(UserFlags.Staff)) badges.push('Discord Staff');
  if (flags.has(UserFlags.Partner)) badges.push('Discord Partner');
  if (flags.has(UserFlags.CertifiedModerator)) badges.push('Discord Certified Moderator');
  if (flags.has(UserFlags.Hypesquad)) badges.push('HypeSquad Events');
  if (flags.has(UserFlags.HypeSquadOnlineHouse1)) badges.push('House of Bravery');
  if (flags.has(UserFlags.HypeSquadOnlineHouse2)) badges.push('House of Brilliance');
  if (flags.has(UserFlags.HypeSquadOnlineHouse3)) badges.push('House of Balance');
  if (flags.has(UserFlags.BugHunterLevel1)) badges.push('Bug Hunter (Level 1)');
  if (flags.has(UserFlags.BugHunterLevel2)) badges.push('Bug Hunter (Level 2)');
  if (flags.has(UserFlags.ActiveDeveloper)) badges.push('Active Developer');
  if (flags.has(UserFlags.VerifiedDeveloper)) badges.push('Early Verified Bot Developer');
  if (flags.has(UserFlags.PremiumEarlySupporter)) badges.push('Early Nitro Supporter');
  
  return badges;
}

/**
 * Get key permissions from PermissionsBitField
 */
function getKeyPermissions(permissions: PermissionsBitField): string[] {
  const keyPermList: string[] = [];
  
  // Check for key permissions
  if (permissions.has('Administrator')) keyPermList.push('Administrator');
  if (permissions.has('ManageGuild')) keyPermList.push('Manage Server');
  if (permissions.has('ManageRoles')) keyPermList.push('Manage Roles');
  if (permissions.has('ManageChannels')) keyPermList.push('Manage Channels');
  if (permissions.has('KickMembers')) keyPermList.push('Kick Members');
  if (permissions.has('BanMembers')) keyPermList.push('Ban Members');
  if (permissions.has('ManageMessages')) keyPermList.push('Manage Messages');
  if (permissions.has('MentionEveryone')) keyPermList.push('Mention Everyone');
  if (permissions.has('ManageWebhooks')) keyPermList.push('Manage Webhooks');
  if (permissions.has('ManageEmojisAndStickers')) keyPermList.push('Manage Emojis & Stickers');
  if (permissions.has('ViewAuditLog')) keyPermList.push('View Audit Log');
  if (permissions.has('ModerateMembers')) keyPermList.push('Timeout Members');
  
  return keyPermList;
}

/**
 * Get special acknowledgements for a guild member
 */
function getMemberAcknowledgements(member: GuildMember, guild: any): string[] {
  const acknowledgements: string[] = [];
  
  // Check for owner
  if (guild.ownerId === member.id) {
    acknowledgements.push('Server Owner');
  }
  
  // Check for server boosting
  if (member.premiumSince) {
    const boostTimestamp = Math.floor(member.premiumSince.getTime() / 1000);
    acknowledgements.push(`Server Booster <t:${boostTimestamp}:R>`);
  }
  
  // Check for administrator
  if (member.permissions.has('Administrator') && guild.ownerId !== member.id) {
    acknowledgements.push('Server Administrator');
  }
  // Check for moderator roles (if not already an administrator)
  else if (member.permissions.has(['KickMembers', 'BanMembers']) && guild.ownerId !== member.id) {
    acknowledgements.push('Server Moderator');
  }
  
  return acknowledgements;
}