import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  TextChannel,
  PermissionFlagsBits,
  GuildMember,
  User
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "channellock",
  description: "Lock or unlock a specific channel quickly",
  category: "moderation",
  aliases: ["chlock", "cl"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: ["ManageChannels", "ManageRoles"],
  options: [
    {
      name: "action",
      description: "Whether to lock or unlock the channel",
      type: "STRING",
      required: true,
      choices: [
        { name: "Lock", value: "lock" },
        { name: "Unlock", value: "unlock" }
      ]
    },
    {
      name: "reason",
      description: "Reason for locking/unlocking the channel",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let action: 'lock' | 'unlock' = 'lock';
    let reason = "No reason provided";
    let channel: TextChannel;
    
    // Parse arguments based on interaction type
    if (interaction instanceof CommandInteraction) {
      const actionOption = interaction.options.get("action");
      if (actionOption?.value) {
        action = String(actionOption.value) as 'lock' | 'unlock';
      }
      
      const reasonOption = interaction.options.get("reason");
      if (reasonOption?.value) {
        reason = String(reasonOption.value);
      }
      
      // Use the current channel
      channel = interaction.channel as TextChannel;
    } else {
      // Handle message command arguments
      if (!args || args.length < 1) {
        return interaction.reply("❌ Usage: !channellock <lock|unlock> [reason]");
      }
      
      // Parse action
      if (args[0].toLowerCase() === 'lock' || args[0].toLowerCase() === 'on') {
        action = 'lock';
      } else if (args[0].toLowerCase() === 'unlock' || args[0].toLowerCase() === 'off') {
        action = 'unlock';
      } else {
        return interaction.reply("❌ Invalid action. Use 'lock' or 'unlock'");
      }
      
      // Parse reason if provided
      if (args.length > 1) {
        reason = args.slice(1).join(" ");
      }
      
      // Use the current channel
      channel = interaction.channel as TextChannel;
    }
    
    // Make sure we're in a text channel
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      const errorMsg = "❌ This command can only be used in text channels within a server.";
      if (interaction instanceof CommandInteraction) {
        return await interaction.reply({ content: errorMsg, ephemeral: true });
      } else {
        return await interaction.reply(errorMsg);
      }
    }
    
    // Get guild and member
    const guild = channel.guild;
    const member = interaction instanceof CommandInteraction ? 
      interaction.member as GuildMember : 
      interaction.member as GuildMember;
    
    // Check permissions
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      const errorMsg = "❌ You don't have permission to manage channels.";
      if (interaction instanceof CommandInteraction) {
        return await interaction.reply({ content: errorMsg, ephemeral: true });
      } else {
        return await interaction.reply(errorMsg);
      }
    }
    
    // Check bot permissions
    const bot = guild.members.cache.get(interaction.client.user.id);
    if (!bot?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      const errorMsg = "❌ I don't have permission to manage channels.";
      if (interaction instanceof CommandInteraction) {
        return await interaction.reply({ content: errorMsg, ephemeral: true });
      } else {
        return await interaction.reply(errorMsg);
      }
    }
    
    try {
      // Get the @everyone role
      const everyoneRole = guild.roles.everyone;
      
      // Set permissions for the channel
      const permissionUpdates = {
        SendMessages: action === 'lock' ? false : null,
        AddReactions: action === 'lock' ? false : null
      };
      
      // Apply the permission update
      await channel.permissionOverwrites.edit(everyoneRole, permissionUpdates);
      
      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setTitle(action === 'lock' ? '🔒 Channel Locked' : '🔓 Channel Unlocked')
        .setDescription(`This channel has been ${action === 'lock' ? 'locked' : 'unlocked'}.`)
        .addFields({ name: 'Reason', value: reason })
        .setColor(action === 'lock' ? 0xFF0000 : 0x00FF00)
        .setFooter({ 
          text: `${action === 'lock' ? 'Locked' : 'Unlocked'} by ${
            interaction instanceof CommandInteraction ? 
            interaction.user.tag : 
            interaction.author.tag
          }`
        })
        .setTimestamp();
      
      // Send response
      if (interaction instanceof CommandInteraction) {
        await interaction.reply({ embeds: [successEmbed] });
      } else {
        await interaction.reply({ embeds: [successEmbed] });
      }
      
      // Log to audit log channel if it exists
      try {
        const logChannels = ['mod-log', 'mod-logs', 'modlogs', 'logs', 'audit-log', 'audit-logs', 'admin-logs'];
        
        for (const logChannelName of logChannels) {
          const logChannel = guild.channels.cache.find(ch => 
            ch.name.includes(logChannelName) && ch.isTextBased() && !ch.isDMBased()
          ) as TextChannel | undefined;
          
          if (logChannel) {
            const user = interaction instanceof CommandInteraction ? interaction.user : interaction.author;
            
            const logEmbed = new EmbedBuilder()
              .setTitle(`Channel ${action === 'lock' ? 'Locked' : 'Unlocked'}`)
              .setDescription(`#${channel.name} has been ${action === 'lock' ? 'locked' : 'unlocked'}.`)
              .addFields(
                { name: 'Moderator', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true },
                { name: 'Reason', value: reason }
              )
              .setColor(action === 'lock' ? 0xFF0000 : 0x00FF00)
              .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
            break;
          }
        }
      } catch (err) {
        // Silently ignore errors with logging
        console.log("Error sending to log channel:", err);
      }
    } catch (error) {
      console.error(`Error in channellock command:`, error);
      const errorMsg = `❌ An error occurred while ${action === 'lock' ? 'locking' : 'unlocking'} the channel.`;
      
      if (interaction instanceof CommandInteraction) {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      } else {
        await interaction.reply(errorMsg);
      }
    }
  }
} as DiscordCommand;