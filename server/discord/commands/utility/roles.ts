import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  Role,
  Collection,
  Guild,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionsBitField,
  StringSelectMenuOptionBuilder as StringOption,
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "roles",
  description: "Display information about server roles",
  category: "utility",
  aliases: ["rolelist", "listroles"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "role",
      description: "Get information about a specific role",
      type: "ROLE",
      required: false
    },
    {
      name: "sort",
      description: "How to sort the role list",
      type: "STRING",
      required: false,
      choices: [
        { name: "Hierarchy (Default)", value: "hierarchy" },
        { name: "Member Count", value: "members" },
        { name: "Alphabetical", value: "name" },
        { name: "Creation Date", value: "created" },
        { name: "Color", value: "color" }
      ]
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
    
    // Handle specific role case first
    let targetRole: Role | null = null;
    let sortMethod = "hierarchy";
    
    if (interaction instanceof CommandInteraction) {
      // Get role from options
      const roleOption = interaction.options.getRole("role");
      const sortOption = interaction.options.getString("sort");
      
      if (roleOption) {
        // If role is provided, show detailed info for that role
        return showRoleInfo(interaction, roleOption as Role);
      }
      
      if (sortOption) {
        sortMethod = sortOption;
      }
    } else {
      // Parse message arguments
      if (args && args.length > 0) {
        // Check for sort method flags
        if (args[0].startsWith("--sort=")) {
          sortMethod = args[0].slice(7).toLowerCase();
          
          if (!["hierarchy", "members", "name", "created", "color"].includes(sortMethod)) {
            return interaction.reply({
              content: "❌ Invalid sort method. Use one of: hierarchy, members, name, created, color",
              ephemeral: true
            });
          }
        } 
        // Otherwise assume it's a role name/ID/mention
        else {
          const roleArg = args[0];
          
          // Check if it's a mention
          const mentionMatch = roleArg.match(/^<@&(\d+)>$/);
          if (mentionMatch) {
            const roleId = mentionMatch[1];
            targetRole = guild.roles.cache.get(roleId) || null;
          } 
          // Check if it's a raw ID
          else if (/^\d+$/.test(roleArg)) {
            targetRole = guild.roles.cache.get(roleArg) || null;
          } 
          // Try to find by name
          else {
            targetRole = guild.roles.cache.find(r => 
              r.name.toLowerCase() === roleArg.toLowerCase()
            ) || null;
          }
          
          if (targetRole) {
            return showRoleInfo(interaction, targetRole);
          } else {
            return interaction.reply({
              content: `❌ Could not find a role with name/ID "${roleArg}"`,
              ephemeral: true
            });
          }
        }
      }
    }
    
    // If no specific role provided, show role list
    return showRoleList(interaction, guild, sortMethod);
  }
} as DiscordCommand;

/**
 * Show detailed information about a specific role
 */
async function showRoleInfo(
  interaction: CommandInteraction | Message, 
  role: Role
): Promise<any> {
  const guild = role.guild;
  
  // Get creation date
  const createdTimestamp = Math.floor(role.createdTimestamp / 1000);
  
  // Count members with this role
  const memberCount = guild.members.cache.filter(member => member.roles.cache.has(role.id)).size;
  
  // Format permissions
  const permissionsList = formatPermissions(role.permissions);
  
  // Format color
  const colorString = role.hexColor !== "#000000" ? role.hexColor : "None";
  
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`Role: ${role.name}`)
    .setColor(role.color || 0x3498DB)
    .addFields(
      { name: "ID", value: role.id, inline: true },
      { name: "Created", value: `<t:${createdTimestamp}:R>`, inline: true },
      { name: "Position", value: `${role.position} of ${guild.roles.cache.size}`, inline: true },
      { name: "Members", value: `${memberCount}`, inline: true },
      { name: "Color", value: colorString, inline: true },
      { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
      { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
      { name: "Managed", value: role.managed ? "Yes (External Integration)" : "No", inline: true }
    );
  
  // Add permissions if any
  if (permissionsList.length > 0) {
    embed.addFields({ 
      name: "Key Permissions", 
      value: permissionsList.map(p => `\`${p}\``).join(", "),
      inline: false
    });
  }
  
  // Add icon if available
  if (role.icon) {
    embed.setThumbnail(role.iconURL({ size: 128 }) || null);
  }
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Show a paginated list of roles in the server
 */
async function showRoleList(
  interaction: CommandInteraction | Message, 
  guild: Guild, 
  sortMethod: string
): Promise<any> {
  // Get all roles, excluding @everyone
  let roles = guild.roles.cache.filter(role => role.id !== guild.id);
  
  // Sort roles
  roles = sortRoles(roles, sortMethod, guild);
  
  // Group roles into pages (max 25 per page)
  const rolesArray = Array.from(roles.values());
  const rolesPerPage = 15;
  const pages: Role[][] = [];
  
  for (let i = 0; i < rolesArray.length; i += rolesPerPage) {
    pages.push(rolesArray.slice(i, i + rolesPerPage));
  }
  
  // If no roles to display
  if (pages.length === 0) {
    return interaction.reply({
      content: "❌ There are no roles to display in this server.",
      ephemeral: true
    });
  }
  
  // Create embeds for each page
  const embeds: EmbedBuilder[] = [];
  let currentPage = 0;
  
  for (let i = 0; i < pages.length; i++) {
    embeds.push(createRoleListEmbed(guild, pages[i], i + 1, pages.length, sortMethod));
  }
  
  // If we can use components, create an interactive message
  if (interaction instanceof CommandInteraction || "createMessageComponentCollector" in interaction.channel!) {
    // Create navigation buttons
    const pageButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("roles-prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⬅️")
        .setDisabled(pages.length <= 1),
      new ButtonBuilder()
        .setCustomId("roles-next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("➡️")
        .setDisabled(pages.length <= 1)
    );
    
    // Create sort menu
    const sortMenu = new StringSelectMenuBuilder()
      .setCustomId("roles-sort")
      .setPlaceholder(`Sort: ${capitalize(sortMethod)}`)
      .addOptions(
        new StringOption()
          .setLabel("Hierarchy")
          .setDescription("Sort by role position")
          .setValue("hierarchy")
          .setDefault(sortMethod === "hierarchy"),
        new StringOption()
          .setLabel("Member Count")
          .setDescription("Sort by number of members")
          .setValue("members")
          .setDefault(sortMethod === "members"),
        new StringOption()
          .setLabel("Alphabetical")
          .setDescription("Sort by role name")
          .setValue("name")
          .setDefault(sortMethod === "name"),
        new StringOption()
          .setLabel("Creation Date")
          .setDescription("Sort by when roles were created")
          .setValue("created")
          .setDefault(sortMethod === "created"),
        new StringOption()
          .setLabel("Color")
          .setDescription("Sort by role color")
          .setValue("color")
          .setDefault(sortMethod === "color")
      );
    
    const sortRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(sortMenu);
    
    // Send initial response with components
    const response = await interaction.reply({
      embeds: [embeds[currentPage]],
      components: [sortRow, pageButtons]
    });
    
    // Create component collector
    const filter = (i: any) => {
      return (i.customId === "roles-prev" || 
              i.customId === "roles-next" || 
              i.customId === "roles-sort") && 
             (interaction instanceof CommandInteraction ? 
              i.user.id === interaction.user.id : 
              i.user.id === interaction.author.id);
    };
    
    const collector = response.createMessageComponentCollector({ 
      filter, 
      time: 300000 
    });
    
    collector.on("collect", async (i) => {
      try {
        if (i.customId === "roles-prev") {
          currentPage = (currentPage - 1 + embeds.length) % embeds.length;
          await i.update({ embeds: [embeds[currentPage]] });
        } 
        else if (i.customId === "roles-next") {
          currentPage = (currentPage + 1) % embeds.length;
          await i.update({ embeds: [embeds[currentPage]] });
        }
        else if (i.customId === "roles-sort" && i.isStringSelectMenu()) {
          const newSortMethod = i.values[0];
          
          // Resort and rebuild embeds
          const newRoles = sortRoles(roles, newSortMethod, guild);
          const newRolesArray = Array.from(newRoles.values());
          const newPages: Role[][] = [];
          
          for (let i = 0; i < newRolesArray.length; i += rolesPerPage) {
            newPages.push(newRolesArray.slice(i, i + rolesPerPage));
          }
          
          const newEmbeds: EmbedBuilder[] = [];
          for (let i = 0; i < newPages.length; i++) {
            newEmbeds.push(createRoleListEmbed(guild, newPages[i], i + 1, newPages.length, newSortMethod));
          }
          
          // Reset page and update embeds
          currentPage = 0;
          embeds.length = 0;
          embeds.push(...newEmbeds);
          
          // Update sort menu
          const newSortMenu = StringSelectMenuBuilder.from(sortMenu)
            .setPlaceholder(`Sort: ${capitalize(newSortMethod)}`);
          
          const options = sortMenu.options.map(option => {
            const value = JSON.parse(JSON.stringify(option)).value;
            return value === newSortMethod ? 
              StringOption.from(option).setDefault(true) : 
              StringOption.from(option).setDefault(false);
          });
          
          newSortMenu.setOptions(options);
          const newSortRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(newSortMenu);
          
          // Update message
          await i.update({ 
            embeds: [embeds[currentPage]],
            components: [newSortRow, pageButtons] 
          });
        }
      } catch (error) {
        console.error("Error handling role list interaction:", error);
      }
    });
    
    collector.on("end", async () => {
      // Remove components once the collector ends
      try {
        if (interaction instanceof CommandInteraction) {
          await interaction.editReply({ 
            embeds: [embeds[currentPage]], 
            components: [] 
          });
        } else {
          // For message commands, try to edit the original response
          const msg = await response.fetch();
          await msg.edit({
            embeds: [embeds[currentPage]],
            components: []
          });
        }
      } catch (error) {
        console.error("Error updating expired role list message:", error);
      }
    });
    
    return response;
  } else {
    // If we can't use components, just send the first page
    return interaction.reply({ embeds: [embeds[0]] });
  }
}

/**
 * Create an embed showing a list of roles
 */
function createRoleListEmbed(
  guild: Guild, 
  roles: Role[], 
  page: number, 
  totalPages: number, 
  sortMethod: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Roles in ${guild.name}`)
    .setColor(0x3498DB)
    .setDescription(`${guild.roles.cache.size - 1} roles total (excluding @everyone)`)
    .setFooter({ text: `Page ${page}/${totalPages} • Sorted by: ${capitalize(sortMethod)}` })
    .setTimestamp();
  
  // Add list of roles
  let rolesList = "";
  
  for (const role of roles) {
    // Format each role entry
    const memberCount = guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;
    
    rolesList += `<@&${role.id}>`;
    
    // If sortMethod is not hierarchy, show position
    if (sortMethod !== "hierarchy") {
      rolesList += ` (Pos: ${role.position})`;
    }
    
    // If sortMethod is not members, show member count
    if (sortMethod !== "members") {
      rolesList += ` - ${memberCount} member${memberCount !== 1 ? 's' : ''}`;
    }
    
    // Show management status for managed roles
    if (role.managed) {
      rolesList += " (Bot/Integration)";
    }
    
    rolesList += "\n";
  }
  
  embed.setDescription(rolesList || "No roles found");
  
  return embed;
}

/**
 * Sort roles based on the specified method
 */
function sortRoles(roles: Collection<string, Role>, method: string, guild: Guild): Collection<string, Role> {
  switch (method) {
    case "hierarchy":
      // Default Discord hierarchy (already sorted by position)
      return roles.sort((a, b) => b.position - a.position);
    
    case "members":
      // Sort by member count (most to least)
      return roles.sort((a, b) => {
        const aCount = guild.members.cache.filter(m => m.roles.cache.has(a.id)).size;
        const bCount = guild.members.cache.filter(m => m.roles.cache.has(b.id)).size;
        return bCount - aCount || b.position - a.position;
      });
    
    case "name":
      // Sort alphabetically
      return roles.sort((a, b) => {
        return a.name.localeCompare(b.name) || b.position - a.position;
      });
    
    case "created":
      // Sort by creation date (newest first)
      return roles.sort((a, b) => {
        return b.createdTimestamp - a.createdTimestamp || b.position - a.position;
      });
    
    case "color":
      // Sort by color (grouped by color, then by position)
      return roles.sort((a, b) => {
        return b.color - a.color || b.position - a.position;
      });
    
    default:
      // Default to hierarchy
      return roles.sort((a, b) => b.position - a.position);
  }
}

/**
 * Format permissions into a readable list
 */
function formatPermissions(permissions: PermissionsBitField): string[] {
  const keyPermissions: string[] = [];
  
  // Check for key permissions
  if (permissions.has('Administrator')) keyPermissions.push('Administrator');
  
  // These only matter if not Administrator
  if (!permissions.has('Administrator')) {
    // Server management
    if (permissions.has('ManageGuild')) keyPermissions.push('Manage Server');
    if (permissions.has('ManageRoles')) keyPermissions.push('Manage Roles');
    if (permissions.has('ManageChannels')) keyPermissions.push('Manage Channels');
    if (permissions.has('ManageWebhooks')) keyPermissions.push('Manage Webhooks');
    if (permissions.has('ManageEmojisAndStickers')) keyPermissions.push('Manage Emojis & Stickers');
    if (permissions.has('ViewAuditLog')) keyPermissions.push('View Audit Log');
    
    // Moderation
    if (permissions.has('KickMembers')) keyPermissions.push('Kick Members');
    if (permissions.has('BanMembers')) keyPermissions.push('Ban Members');
    if (permissions.has('ModerateMembers')) keyPermissions.push('Timeout Members');
    if (permissions.has('ManageMessages')) keyPermissions.push('Manage Messages');
    if (permissions.has('ManageThreads')) keyPermissions.push('Manage Threads');
    if (permissions.has('ManageNicknames')) keyPermissions.push('Manage Nicknames');
    
    // Dangerous permissions
    if (permissions.has('MentionEveryone')) keyPermissions.push('Mention Everyone');
    
    // Voice permissions
    if (permissions.has('MuteMembers')) keyPermissions.push('Mute Members');
    if (permissions.has('DeafenMembers')) keyPermissions.push('Deafen Members');
    if (permissions.has('MoveMembers')) keyPermissions.push('Move Members');
    if (permissions.has('PrioritySpeaker')) keyPermissions.push('Priority Speaker');
  }
  
  return keyPermissions;
}

/**
 * Capitalize the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}