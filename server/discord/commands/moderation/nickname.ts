import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  GuildMember, 
  PermissionFlagsBits,
  Guild
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "nickname",
  description: "Change a user's nickname",
  category: "moderation",
  aliases: ["nick", "changenick", "setnick"],
  slash: true,
  prefix: true,
  cooldown: 10,
  permissions: ["ManageNicknames"],
  options: [
    {
      name: "user",
      description: "The user to change nickname for",
      type: "USER",
      required: true
    },
    {
      name: "nickname",
      description: "The new nickname (leave empty to remove nickname)",
      type: "STRING",
      required: false
    },
    {
      name: "reason",
      description: "Reason for changing the nickname",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get guild object
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Parse arguments
    let targetUser;
    let newNickname = "";
    let reason = "";
    
    if (interaction instanceof CommandInteraction) {
      // Get options from slash command
      targetUser = interaction.options.getUser("user");
      newNickname = interaction.options.getString("nickname") || "";
      reason = interaction.options.getString("reason") || "No reason provided";
    } else {
      // Parse message command arguments
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ Please specify a user. Usage: `!nickname @user [new nickname] [reason]`",
          ephemeral: true
        });
      }
      
      // First argument is the user mention/ID
      const userMention = args[0].match(/^<@!?(\d+)>$/);
      const userId = userMention ? userMention[1] : args[0];
      
      try {
        targetUser = await interaction.client.users.fetch(userId);
      } catch (error) {
        return interaction.reply({
          content: "❌ Invalid user specified. Please mention a user or provide a valid user ID.",
          ephemeral: true
        });
      }
      
      // Remaining arguments are the nickname (and possibly reason)
      if (args.length > 1) {
        // Check if there's a reason (denoted by | or // or -r)
        const reasonIndex = args.findIndex(arg => arg === '|' || arg === '//' || arg === '-r');
        
        if (reasonIndex !== -1) {
          // Everything before is nickname, everything after is reason
          newNickname = args.slice(1, reasonIndex).join(' ');
          reason = args.slice(reasonIndex + 1).join(' ');
        } else {
          // All remaining arguments form the nickname
          newNickname = args.slice(1).join(' ');
        }
      }
      
      // Default reason if not provided
      reason = reason || "No reason provided";
    }
    
    if (!targetUser) {
      return interaction.reply({
        content: "❌ User not found.",
        ephemeral: true
      });
    }
    
    try {
      // Get member from user
      const member = await guild.members.fetch(targetUser.id);
      
      // Check permissions
      const actionBy = interaction instanceof Message ? interaction.member : interaction.member;
      if (actionBy && !canChangeNickname(actionBy as GuildMember, member, guild)) {
        return interaction.reply({
          content: "❌ You don't have permission to change this user's nickname.",
          ephemeral: true
        });
      }
      
      // Store previous nickname for logging
      const previousNickname = member.nickname || targetUser.username;
      
      // Change nickname
      await member.setNickname(newNickname, reason);
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle("✅ Nickname Changed")
        .setColor(0x2ECC71)
        .addFields(
          { name: "User", value: `${targetUser} (${targetUser.tag})`, inline: false },
          { name: "Previous Nickname", value: previousNickname, inline: true },
          { name: "New Nickname", value: newNickname || "*Nickname removed*", inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setFooter({
          text: `Changed by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
        })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error changing nickname:", error);
      
      return interaction.reply({
        content: `❌ Failed to change nickname: ${(error as Error).message}`,
        ephemeral: true
      });
    }
  }
} as DiscordCommand;

/**
 * Check if a moderator can change a member's nickname
 */
function canChangeNickname(
  moderator: GuildMember, 
  target: GuildMember,
  guild: Guild
): boolean {
  // Bot owners and guild owners can always change nicknames
  if (moderator.id === guild.ownerId || process.env.BOT_OWNER_ID === moderator.id) {
    return true;
  }
  
  // User cannot change nickname of users with higher or equal role
  if (moderator.id !== target.id) { // If not changing own nickname
    // Compare highest roles
    const moderatorRole = moderator.roles.highest;
    const targetRole = target.roles.highest;
    
    if (targetRole.position >= moderatorRole.position) {
      return false;
    }
  }
  
  // Check if user can manage nicknames
  return moderator.permissions.has(PermissionFlagsBits.ManageNicknames);
}

// Bulk nickname change command
export const reset = {
  name: "resetnicks",
  description: "Reset nicknames for multiple users",
  category: "moderation",
  aliases: ["clearnicks", "massnick"],
  slash: true,
  prefix: true,
  cooldown: 60,
  permissions: ["ManageNicknames", "Administrator"],
  options: [
    {
      name: "type",
      description: "Type of users to reset nicknames for",
      type: "STRING",
      required: true,
      choices: [
        { name: "All Members", value: "all" },
        { name: "Bots", value: "bots" },
        { name: "Humans", value: "humans" },
        { name: "Role", value: "role" }
      ]
    },
    {
      name: "role",
      description: "The role to target (if type is 'role')",
      type: "ROLE",
      required: false
    },
    {
      name: "reason",
      description: "Reason for resetting nicknames",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get guild object
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Parse arguments
    let type = "all";
    let roleId = "";
    let reason = "Mass nickname reset";
    
    if (interaction instanceof CommandInteraction) {
      // Get options from slash command
      type = interaction.options.getString("type") || "all";
      if (type === "role") {
        const role = interaction.options.getRole("role");
        roleId = role ? role.id : "";
      }
      reason = interaction.options.getString("reason") || reason;
    } else {
      // Parse message command arguments
      if (!args || args.length === 0) {
        return interaction.reply({
          content: "❌ Please specify a type. Usage: `!resetnicks <all|bots|humans|role> [role ID] [reason]`",
          ephemeral: true
        });
      }
      
      // First argument is the type
      type = args[0].toLowerCase();
      if (!["all", "bots", "humans", "role"].includes(type)) {
        return interaction.reply({
          content: "❌ Invalid type. Use one of: all, bots, humans, role",
          ephemeral: true
        });
      }
      
      // If type is role, second argument should be role ID
      if (type === "role" && args.length > 1) {
        // Check if it's a valid role mention or ID
        const roleMention = args[1].match(/^<@&(\d+)>$/);
        roleId = roleMention ? roleMention[1] : args[1];
        
        // Validate role exists
        if (!guild.roles.cache.has(roleId)) {
          return interaction.reply({
            content: "❌ Invalid role specified. Please provide a valid role mention or ID.",
            ephemeral: true
          });
        }
      }
      
      // Check for reason (after type and optional role)
      const reasonStartIndex = type === "role" ? 2 : 1;
      if (args.length > reasonStartIndex) {
        reason = args.slice(reasonStartIndex).join(' ');
      }
    }
    
    // Validate role if type is role
    if (type === "role" && !roleId) {
      return interaction.reply({
        content: "❌ Please specify a role when using the 'role' type.",
        ephemeral: true
      });
    }
    
    try {
      // Defer reply for long operation
      let response;
      if (interaction instanceof CommandInteraction) {
        await interaction.deferReply();
      } else {
        response = await interaction.reply("🔄 Resetting nicknames... This may take a while.");
      }
      
      // Fetch all members if needed
      if (guild.members.cache.size < guild.memberCount && guild.memberCount <= 1000) {
        await guild.members.fetch();
      }
      
      // Filter members based on type
      let targetMembers = guild.members.cache;
      
      switch (type) {
        case "bots":
          targetMembers = targetMembers.filter(member => member.user.bot);
          break;
        case "humans":
          targetMembers = targetMembers.filter(member => !member.user.bot);
          break;
        case "role":
          targetMembers = targetMembers.filter(member => member.roles.cache.has(roleId));
          break;
      }
      
      // Filter out members we can't modify
      const moderator = interaction instanceof Message ? 
        interaction.member as GuildMember : 
        interaction.member as GuildMember;
      
      targetMembers = targetMembers.filter(member => 
        canChangeNickname(moderator, member, guild) && member.nickname !== null
      );
      
      // Early exit if no members to modify
      if (targetMembers.size === 0) {
        const replyContent = "ℹ️ No members found that match the criteria and have nicknames that can be reset.";
        
        if (interaction instanceof CommandInteraction) {
          return interaction.editReply(replyContent);
        } else if (response) {
          return response.edit(replyContent);
        }
        return;
      }
      
      // Track success and failures
      let successCount = 0;
      const failures: string[] = [];
      
      // Process members in chunks to avoid rate limits
      const members = Array.from(targetMembers.values());
      const chunkSize = 10;
      
      for (let i = 0; i < members.length; i += chunkSize) {
        const chunk = members.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(async (member) => {
          try {
            await member.setNickname(null, reason);
            successCount++;
          } catch (error) {
            failures.push(`${member.user.tag}: ${(error as Error).message}`);
          }
        }));
        
        // Wait a bit between chunks to avoid rate limits
        if (i + chunkSize < members.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Create completion embed
      const embed = new EmbedBuilder()
        .setTitle("✅ Nickname Reset Complete")
        .setColor(0x2ECC71)
        .setDescription(`Reset nicknames for ${successCount} members.`)
        .addFields(
          { name: "Type", value: capitalize(type), inline: true },
          type === "role" ? { name: "Role", value: `<@&${roleId}>`, inline: true } : { name: '\u200B', value: '\u200B', inline: true },
          { name: "Reason", value: reason, inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
        })
        .setTimestamp();
      
      // Add failures if any
      if (failures.length > 0) {
        const failureText = failures.length > 10 
          ? `${failures.slice(0, 10).join('\n')}\n... and ${failures.length - 10} more.`
          : failures.join('\n');
        
        embed.addFields({ name: `Failures (${failures.length})`, value: failureText, inline: false });
      }
      
      // Send completion message
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [embed] });
      } else if (response) {
        await response.edit({ content: null, embeds: [embed] });
      }
    } catch (error) {
      const errorMessage = `❌ Error resetting nicknames: ${(error as Error).message}`;
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ content: errorMessage });
      } else if (response) {
        await response.edit({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage });
      }
    }
  }
} as DiscordCommand;

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}