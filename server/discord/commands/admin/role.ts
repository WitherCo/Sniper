import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  Role,
  GuildMember,
  Guild,
  ColorResolvable,
  PermissionResolvable,
  TextChannel,
  PermissionFlagsBits
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "role",
  description: "Manage server roles",
  category: "admin",
  aliases: ["roles", "rolemanage"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageRoles"],
  options: [
    {
      name: "create",
      description: "Create a new role",
      type: "SUB_COMMAND",
      options: [
        {
          name: "name",
          description: "The name of the role",
          type: "STRING",
          required: true
        },
        {
          name: "color",
          description: "The color of the role (hex code)",
          type: "STRING",
          required: false
        },
        {
          name: "hoist",
          description: "Whether to display the role separately in the member list",
          type: "BOOLEAN",
          required: false
        },
        {
          name: "mentionable",
          description: "Whether the role can be mentioned",
          type: "BOOLEAN",
          required: false
        }
      ]
    },
    {
      name: "delete",
      description: "Delete a role",
      type: "SUB_COMMAND",
      options: [
        {
          name: "role",
          description: "The role to delete",
          type: "ROLE",
          required: true
        }
      ]
    },
    {
      name: "add",
      description: "Add a role to a user",
      type: "SUB_COMMAND",
      options: [
        {
          name: "user",
          description: "The user to add the role to",
          type: "USER",
          required: true
        },
        {
          name: "role",
          description: "The role to add",
          type: "ROLE",
          required: true
        }
      ]
    },
    {
      name: "remove",
      description: "Remove a role from a user",
      type: "SUB_COMMAND",
      options: [
        {
          name: "user",
          description: "The user to remove the role from",
          type: "USER",
          required: true
        },
        {
          name: "role",
          description: "The role to remove",
          type: "ROLE",
          required: true
        }
      ]
    },
    {
      name: "edit",
      description: "Edit a role's properties",
      type: "SUB_COMMAND",
      options: [
        {
          name: "role",
          description: "The role to edit",
          type: "ROLE",
          required: true
        },
        {
          name: "name",
          description: "The new name of the role",
          type: "STRING",
          required: false
        },
        {
          name: "color",
          description: "The new color of the role (hex code)",
          type: "STRING",
          required: false
        },
        {
          name: "hoist",
          description: "Whether to display the role separately in the member list",
          type: "BOOLEAN",
          required: false
        },
        {
          name: "mentionable",
          description: "Whether the role can be mentioned",
          type: "BOOLEAN",
          required: false
        }
      ]
    },
    {
      name: "info",
      description: "Get information about a role",
      type: "SUB_COMMAND",
      options: [
        {
          name: "role",
          description: "The role to get information about",
          type: "ROLE",
          required: true
        }
      ]
    },
    {
      name: "list",
      description: "List all roles in the server",
      type: "SUB_COMMAND"
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply("❌ This command can only be used in a server.");
    }
    
    // Check if bot has permission to manage roles
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply("❌ I don't have permission to manage roles in this server.");
    }
    
    // Process prefix command with args
    if (interaction instanceof Message) {
      if (!args || args.length === 0) {
        return listRoles(interaction, guild);
      }
      
      const subcommand = args[0].toLowerCase();
      
      switch (subcommand) {
        case "create":
          if (args.length < 2) {
            return interaction.reply("❌ Please provide a name for the role.");
          }
          
          // Get role name and optional parameters
          const name = args[1];
          let color: string | undefined;
          let hoist: boolean | undefined;
          let mentionable: boolean | undefined;
          
          // Check for optional parameters
          for (let i = 2; i < args.length; i++) {
            const param = args[i].toLowerCase();
            
            if (param.startsWith("color:") || param.startsWith("colour:")) {
              color = param.split(":")[1];
            } else if (param === "hoist" || param === "hoisted") {
              hoist = true;
            } else if (param === "nohoist" || param === "nohoisted") {
              hoist = false;
            } else if (param === "mentionable") {
              mentionable = true;
            } else if (param === "nomentionable") {
              mentionable = false;
            }
          }
          
          return createRole(interaction, guild, name, color, hoist, mentionable);
          
        case "delete":
          if (args.length < 2) {
            return interaction.reply("❌ Please provide a role to delete (name, ID, or mention).");
          }
          
          // Get role from args
          const deleteRoleArg = args[1].replace(/[<@&>]/g, "");
          const deleteRole = await findRole(guild, deleteRoleArg);
          
          if (!deleteRole) {
            return interaction.reply("❌ Role not found.");
          }
          
          return deleteRole_(interaction, deleteRole);
          
        case "add":
          if (args.length < 3) {
            return interaction.reply("❌ Please provide a user and a role.");
          }
          
          // Get member
          const addUserArg = args[1].replace(/[<@!>]/g, "");
          const addMember = await findMember(guild, addUserArg);
          
          if (!addMember) {
            return interaction.reply("❌ User not found.");
          }
          
          // Get role
          const addRoleArg = args[2].replace(/[<@&>]/g, "");
          const addRole = await findRole(guild, addRoleArg);
          
          if (!addRole) {
            return interaction.reply("❌ Role not found.");
          }
          
          return addRoleToMember(interaction, addMember, addRole);
          
        case "remove":
          if (args.length < 3) {
            return interaction.reply("❌ Please provide a user and a role.");
          }
          
          // Get member
          const removeUserArg = args[1].replace(/[<@!>]/g, "");
          const removeMember = await findMember(guild, removeUserArg);
          
          if (!removeMember) {
            return interaction.reply("❌ User not found.");
          }
          
          // Get role
          const removeRoleArg = args[2].replace(/[<@&>]/g, "");
          const removeRole = await findRole(guild, removeRoleArg);
          
          if (!removeRole) {
            return interaction.reply("❌ Role not found.");
          }
          
          return removeRoleFromMember(interaction, removeMember, removeRole);
          
        case "edit":
          if (args.length < 3) {
            return interaction.reply("❌ Please provide a role and at least one property to edit.");
          }
          
          // Get role
          const editRoleArg = args[1].replace(/[<@&>]/g, "");
          const editRole = await findRole(guild, editRoleArg);
          
          if (!editRole) {
            return interaction.reply("❌ Role not found.");
          }
          
          // Parse edit options
          let editName: string | undefined;
          let editColor: string | undefined;
          let editHoist: boolean | undefined;
          let editMentionable: boolean | undefined;
          
          for (let i = 2; i < args.length; i++) {
            const param = args[i].toLowerCase();
            
            if (param.startsWith("name:")) {
              editName = args.slice(i).join(" ").substring(5);
              break; // Name might contain spaces, so we stop parsing
            } else if (param.startsWith("color:") || param.startsWith("colour:")) {
              editColor = param.split(":")[1];
            } else if (param === "hoist" || param === "hoisted") {
              editHoist = true;
            } else if (param === "nohoist" || param === "nohoisted") {
              editHoist = false;
            } else if (param === "mentionable") {
              editMentionable = true;
            } else if (param === "nomentionable") {
              editMentionable = false;
            }
          }
          
          if (!editName && !editColor && editHoist === undefined && editMentionable === undefined) {
            return interaction.reply("❌ Please provide at least one property to edit (name, color, hoist, or mentionable).");
          }
          
          return editRole_(interaction, editRole, editName, editColor, editHoist, editMentionable);
          
        case "info":
          if (args.length < 2) {
            return interaction.reply("❌ Please provide a role to get information about.");
          }
          
          // Get role
          const infoRoleArg = args[1].replace(/[<@&>]/g, "");
          const infoRole = await findRole(guild, infoRoleArg);
          
          if (!infoRole) {
            return interaction.reply("❌ Role not found.");
          }
          
          return getRoleInfo(interaction, infoRole);
          
        case "list":
          return listRoles(interaction, guild);
          
        default:
          return interaction.reply("❌ Unknown subcommand. Available subcommands: create, delete, add, remove, edit, info, list");
      }
    }
    
    // Should never reach here as we set slash: false
    return interaction.reply("This command is only available as a prefix command. Please use !role instead.");
  }
} as DiscordCommand;

/**
 * Create a new role
 */
async function createRole(
  interaction: CommandInteraction | Message,
  guild: Guild,
  name: string,
  color?: string,
  hoist?: boolean,
  mentionable?: boolean
): Promise<any> {
  try {
    // Parse color as hex
    let colorHex: ColorResolvable | undefined;
    if (color) {
      try {
        colorHex = color.startsWith("#") ? color : `#${color}`;
      } catch (error) {
        return interaction.reply("❌ Invalid color format. Please provide a valid hex color code (e.g. #FF0000).");
      }
    }
    
    // Create role
    const role = await guild.roles.create({
      name,
      color: colorHex as ColorResolvable,
      hoist,
      mentionable,
      reason: `Created by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
    });
    
    // Reply with success message
    const embed = new EmbedBuilder()
      .setTitle("✅ Role Created")
      .setDescription(`Successfully created role ${role}`)
      .setColor(role.color || 0x00FF00)
      .addFields(
        { name: "Name", value: role.name, inline: true },
        { name: "Color", value: role.hexColor, inline: true },
        { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
        { name: "ID", value: role.id, inline: true }
      )
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    return interaction.reply(`❌ Failed to create role: ${(error as Error).message}`);
  }
}

/**
 * Delete a role
 */
async function deleteRole_(
  interaction: CommandInteraction | Message,
  role: Role
): Promise<any> {
  try {
    // Check if role is managed by integration
    if (role.managed) {
      return interaction.reply("❌ This role is managed by an integration and cannot be deleted.");
    }
    
    // Get role info before deleting
    const roleInfo = {
      name: role.name,
      color: role.hexColor,
      memberCount: role.members.size
    };
    
    // Delete role
    await role.delete(`Deleted by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`);
    
    // Reply with success message
    const embed = new EmbedBuilder()
      .setTitle("✅ Role Deleted")
      .setDescription(`Successfully deleted role **${roleInfo.name}**`)
      .setColor(0xFF0000)
      .addFields(
        { name: "Name", value: roleInfo.name, inline: true },
        { name: "Color", value: roleInfo.color, inline: true },
        { name: "Members", value: roleInfo.memberCount.toString(), inline: true }
      )
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    return interaction.reply(`❌ Failed to delete role: ${(error as Error).message}`);
  }
}

/**
 * Add a role to a member
 */
async function addRoleToMember(
  interaction: CommandInteraction | Message,
  member: GuildMember,
  role: Role
): Promise<any> {
  try {
    // Check if role is managed by integration
    if (role.managed) {
      return interaction.reply("❌ This role is managed by an integration and cannot be assigned manually.");
    }
    
    // Check if member already has the role
    if (member.roles.cache.has(role.id)) {
      return interaction.reply(`❌ ${member.user.tag} already has the ${role.name} role.`);
    }
    
    // Check if bot has permission to assign the role
    const botMember = await member.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply("❌ I don't have permission to assign this role as it's higher than or equal to my highest role.");
    }
    
    // Add role to member
    await member.roles.add(role, `Added by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`);
    
    // Reply with success message
    const embed = new EmbedBuilder()
      .setTitle("✅ Role Added")
      .setDescription(`Successfully added role ${role} to ${member}`)
      .setColor(role.color || 0x00FF00)
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    return interaction.reply(`❌ Failed to add role: ${(error as Error).message}`);
  }
}

/**
 * Remove a role from a member
 */
async function removeRoleFromMember(
  interaction: CommandInteraction | Message,
  member: GuildMember,
  role: Role
): Promise<any> {
  try {
    // Check if role is managed by integration
    if (role.managed) {
      return interaction.reply("❌ This role is managed by an integration and cannot be removed manually.");
    }
    
    // Check if member has the role
    if (!member.roles.cache.has(role.id)) {
      return interaction.reply(`❌ ${member.user.tag} doesn't have the ${role.name} role.`);
    }
    
    // Check if bot has permission to remove the role
    const botMember = await member.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply("❌ I don't have permission to remove this role as it's higher than or equal to my highest role.");
    }
    
    // Remove role from member
    await member.roles.remove(role, `Removed by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`);
    
    // Reply with success message
    const embed = new EmbedBuilder()
      .setTitle("✅ Role Removed")
      .setDescription(`Successfully removed role ${role} from ${member}`)
      .setColor(0xFF0000)
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    return interaction.reply(`❌ Failed to remove role: ${(error as Error).message}`);
  }
}

/**
 * Edit a role
 */
async function editRole_(
  interaction: CommandInteraction | Message,
  role: Role,
  name?: string,
  color?: string,
  hoist?: boolean,
  mentionable?: boolean
): Promise<any> {
  try {
    // Check if role is managed by integration
    if (role.managed) {
      return interaction.reply("❌ This role is managed by an integration and cannot be edited.");
    }
    
    // Check if bot has permission to edit the role
    const botMember = await role.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply("❌ I don't have permission to edit this role as it's higher than or equal to my highest role.");
    }
    
    // Parse color as hex
    let colorHex: ColorResolvable | undefined;
    if (color) {
      try {
        colorHex = color.startsWith("#") ? color : `#${color}`;
      } catch (error) {
        return interaction.reply("❌ Invalid color format. Please provide a valid hex color code (e.g. #FF0000).");
      }
    }
    
    // Save old properties for comparison
    const oldName = role.name;
    const oldColor = role.hexColor;
    const oldHoist = role.hoist;
    const oldMentionable = role.mentionable;
    
    // Edit role
    await role.edit({
      name: name || role.name,
      color: colorHex as ColorResolvable || role.color,
      hoist: hoist !== undefined ? hoist : role.hoist,
      mentionable: mentionable !== undefined ? mentionable : role.mentionable,
      reason: `Edited by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`
    });
    
    // Create embed fields
    const fields = [];
    
    if (name && name !== oldName) {
      fields.push({ name: "Name", value: `${oldName} → ${role.name}`, inline: true });
    }
    
    if (colorHex && role.hexColor !== oldColor) {
      fields.push({ name: "Color", value: `${oldColor} → ${role.hexColor}`, inline: true });
    }
    
    if (hoist !== undefined && role.hoist !== oldHoist) {
      fields.push({ name: "Hoisted", value: `${oldHoist ? "Yes" : "No"} → ${role.hoist ? "Yes" : "No"}`, inline: true });
    }
    
    if (mentionable !== undefined && role.mentionable !== oldMentionable) {
      fields.push({ name: "Mentionable", value: `${oldMentionable ? "Yes" : "No"} → ${role.mentionable ? "Yes" : "No"}`, inline: true });
    }
    
    if (fields.length === 0) {
      fields.push({ name: "No Changes", value: "No changes were made to the role.", inline: false });
    }
    
    // Reply with success message
    const embed = new EmbedBuilder()
      .setTitle("✅ Role Edited")
      .setDescription(`Successfully edited role ${role}`)
      .setColor(role.color || 0x00FF00)
      .addFields(...fields)
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    return interaction.reply(`❌ Failed to edit role: ${(error as Error).message}`);
  }
}

/**
 * Get information about a role
 */
async function getRoleInfo(
  interaction: CommandInteraction | Message,
  role: Role
): Promise<any> {
  try {
    // Format created timestamp
    const createdTimestamp = Math.floor(role.createdTimestamp / 1000);
    
    // Get permissions
    const permissions = formatPermissions(role.permissions.toArray());
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`Role Information: ${role.name}`)
      .setColor(role.color || 0x00FF00)
      .addFields(
        { name: "ID", value: role.id, inline: true },
        { name: "Color", value: role.hexColor, inline: true },
        { name: "Position", value: role.position.toString(), inline: true },
        { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
        { name: "Managed", value: role.managed ? "Yes" : "No", inline: true },
        { name: "Created", value: `<t:${createdTimestamp}:R>`, inline: true },
        { name: "Members", value: role.members.size.toString(), inline: true }
      )
      .setTimestamp();
    
    // Add permissions field if there are any
    if (permissions.length > 0) {
      embed.addFields({ name: "Key Permissions", value: permissions.join(", "), inline: false });
    }
    
    // Send embed
    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    return interaction.reply(`❌ Failed to get role info: ${(error as Error).message}`);
  }
}

/**
 * List all roles in the server
 */
async function listRoles(
  interaction: CommandInteraction | Message,
  guild: Guild
): Promise<any> {
  try {
    // Get all roles in reverse order (highest position first)
    const roles = [...guild.roles.cache.values()]
      .sort((a, b) => b.position - a.position);
    
    // Create chunks of roles for pagination
    const chunks = [];
    for (let i = 0; i < roles.length; i += 15) {
      chunks.push(roles.slice(i, i + 15));
    }
    
    // Create embeds for each chunk
    const embeds = chunks.map((chunk, index) => {
      const embed = new EmbedBuilder()
        .setTitle(`Roles in ${guild.name}`)
        .setDescription(`Total roles: ${roles.length}`)
        .setColor(0x00FF00)
        .setFooter({ text: `Page ${index + 1}/${chunks.length}` })
        .setTimestamp();
      
      // Add roles to embed
      chunk.forEach(role => {
        embed.addFields({
          name: role.name,
          value: `ID: ${role.id} | Members: ${role.members.size} | Color: ${role.hexColor}`,
          inline: false
        });
      });
      
      return embed;
    });
    
    // Send first embed
    if (embeds.length === 0) {
      return interaction.reply("❌ No roles found in this server.");
    }
    
    return interaction.reply({ embeds: [embeds[0]] });
  } catch (error) {
    return interaction.reply(`❌ Failed to list roles: ${(error as Error).message}`);
  }
}

/**
 * Find a role by name, ID, or mention
 */
async function findRole(guild: Guild, roleIdentifier: string): Promise<Role | null> {
  // Try to find by ID first
  const roleById = guild.roles.cache.get(roleIdentifier);
  if (roleById) return roleById;
  
  // Try to find by name (case insensitive)
  const roleByName = guild.roles.cache.find(
    role => role.name.toLowerCase() === roleIdentifier.toLowerCase()
  );
  if (roleByName) return roleByName;
  
  return null;
}

/**
 * Find a member by name, ID, or mention
 */
async function findMember(guild: Guild, memberIdentifier: string): Promise<GuildMember | null> {
  try {
    // Try to fetch by ID first
    const member = await guild.members.fetch(memberIdentifier).catch(() => null);
    if (member) return member;
    
    // Try to find by username or nickname (case insensitive)
    const members = await guild.members.fetch();
    return members.find(
      m => 
        m.user.username.toLowerCase() === memberIdentifier.toLowerCase() ||
        (m.nickname && m.nickname.toLowerCase() === memberIdentifier.toLowerCase())
    ) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Format permissions into a readable array
 */
function formatPermissions(permissions: PermissionResolvable[]): string[] {
  const keyPermissions = [
    "Administrator",
    "ManageGuild",
    "ManageRoles",
    "ManageChannels",
    "ManageMessages",
    "BanMembers",
    "KickMembers",
    "MentionEveryone",
    "ManageWebhooks",
    "ManageEmojisAndStickers"
  ];
  
  // Filter and format permissions
  return permissions
    .filter(perm => typeof perm === "string" && keyPermissions.includes(perm))
    .map(perm => {
      if (typeof perm !== "string") return "";
      
      // Format permission name (e.g., "ManageGuild" to "Manage Guild")
      return perm.replace(/([A-Z])/g, " $1").trim();
    })
    .filter(Boolean);
}