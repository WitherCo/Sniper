import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  PermissionsBitField, 
  GuildMember,
  User
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Helper function to format permission names nicely
function formatPermissionName(permission: string): string {
  return permission
    .replace(/([A-Z])/g, ' $1') // Add space before each capital letter
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim() // Remove trailing spaces
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()); // Capitalize first letter of each word
}

export default {
  name: "permissions",
  description: "Display a user's permissions in the current server or channel",
  category: "information",
  aliases: ["perms", "userpermissions"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "user",
      description: "The user to check permissions for (default: yourself)",
      type: "USER",
      required: false
    },
    {
      name: "channel",
      description: "The channel to check permissions in (default: current channel)",
      type: "CHANNEL",
      required: false
    }
  ],
  async execute(interaction: Message) {
    if (!interaction.guild) {
      return await interaction.reply("❌ This command can only be used in a server!");
    }

    const args = interaction.content.split(" ").slice(1);
    
    // Determine the target user
    let targetUser: User | null = interaction.author;
    let targetMember: GuildMember | null = null;
    
    // If a user is mentioned or ID provided
    if (args.length > 0) {
      const userMention = interaction.mentions.users.first();
      if (userMention) {
        targetUser = userMention;
      } else if (/^\d+$/.test(args[0])) {
        try {
          targetUser = await interaction.client.users.fetch(args[0]);
        } catch (error) {
          // If we can't find the user, default to the command user
          targetUser = interaction.author;
        }
      }
    }
    
    // Get the member object from the user
    try {
      targetMember = await interaction.guild.members.fetch(targetUser.id);
    } catch (error) {
      return await interaction.reply(`❌ Could not find member with ID ${targetUser.id} in this server!`);
    }
    
    if (!targetMember) {
      return await interaction.reply("❌ Could not find that member in this server!");
    }
    
    // Get the member's permissions in the server and current channel
    const serverPermissions = targetMember.permissions;
    const channelPermissions = interaction.channel?.permissionsFor(targetMember);
    
    if (!serverPermissions || !channelPermissions) {
      return await interaction.reply("❌ Could not retrieve permissions for that member!");
    }
    
    // Format permissions for display
    const serverPerms: string[] = [];
    const channelPerms: string[] = [];
    
    // Get list of all permissions
    const allPermissions = Object.keys(PermissionsBitField.Flags) as (keyof typeof PermissionsBitField.Flags)[];
    
    // Check each permission
    for (const permission of allPermissions) {
      if (serverPermissions.has(PermissionsBitField.Flags[permission])) {
        serverPerms.push(`✅ ${formatPermissionName(permission)}`);
      } else {
        serverPerms.push(`❌ ${formatPermissionName(permission)}`);
      }
      
      if (channelPermissions.has(PermissionsBitField.Flags[permission])) {
        channelPerms.push(`✅ ${formatPermissionName(permission)}`);
      } else {
        channelPerms.push(`❌ ${formatPermissionName(permission)}`);
      }
    }
    
    // Sort permissions alphabetically
    serverPerms.sort();
    channelPerms.sort();
    
    // Split permissions into chunks to avoid exceeding embed field value limit
    const chunkSize = 10;
    const serverPermChunks = [];
    const channelPermChunks = [];
    
    for (let i = 0; i < serverPerms.length; i += chunkSize) {
      serverPermChunks.push(serverPerms.slice(i, i + chunkSize).join('\n'));
    }
    
    for (let i = 0; i < channelPerms.length; i += chunkSize) {
      channelPermChunks.push(channelPerms.slice(i, i + chunkSize).join('\n'));
    }
    
    // Create the embed for server permissions
    const serverPermEmbed = new EmbedBuilder()
      .setTitle(`Server Permissions for ${targetMember.displayName}`)
      .setColor(targetMember.displayHexColor || '#2F3136')
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
      .setFooter({ text: `User ID: ${targetUser.id}` })
      .setTimestamp();
    
    // Add server permission fields
    for (let i = 0; i < serverPermChunks.length; i++) {
      serverPermEmbed.addFields({
        name: i === 0 ? 'Server Permissions' : '\u200B', // Only show title for first chunk
        value: serverPermChunks[i],
        inline: true
      });
    }
    
    // Create the embed for channel permissions
    const channelPermEmbed = new EmbedBuilder()
      .setTitle(`Channel Permissions for ${targetMember.displayName} in #${interaction.channel?.name}`)
      .setColor(targetMember.displayHexColor || '#2F3136')
      .setFooter({ text: `User ID: ${targetUser.id}` })
      .setTimestamp();
    
    // Add channel permission fields
    for (let i = 0; i < channelPermChunks.length; i++) {
      channelPermEmbed.addFields({
        name: i === 0 ? 'Channel Permissions' : '\u200B', // Only show title for first chunk
        value: channelPermChunks[i],
        inline: true
      });
    }
    
    // Send the embeds
    await interaction.reply({ embeds: [serverPermEmbed] });
    
    // Send channel permissions as a follow-up message
    await interaction.channel?.send({ embeds: [channelPermEmbed] });
  }
} as DiscordCommand;
