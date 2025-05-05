import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  ChannelType, 
  PermissionFlagsBits,
  PermissionsBitField,
  TextChannel,
  GuildMember,
  Role
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "lockdown",
  description: "Lock down channels or the entire server",
  category: "admin",
  aliases: ["lock"],
  slash: true,
  prefix: true,
  cooldown: 30, // Higher cooldown due to potential server impact
  permissions: ["Administrator", "ManageGuild", "ManageChannels"],
  options: [
    {
      name: "action",
      description: "Lock or unlock",
      type: "STRING",
      required: true,
      choices: [
        { name: "Lock", value: "lock" },
        { name: "Unlock", value: "unlock" }
      ]
    },
    {
      name: "target",
      description: "Channel or server",
      type: "STRING",
      required: true,
      choices: [
        { name: "Current Channel", value: "channel" },
        { name: "Category", value: "category" },
        { name: "Entire Server", value: "server" }
      ]
    },
    {
      name: "reason",
      description: "Reason for lockdown",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let action: 'lock' | 'unlock' = 'lock';
    let target: 'channel' | 'category' | 'server' = 'channel';
    let reason = "No reason provided";
    
    // Parse arguments based on interaction type
    if (interaction instanceof CommandInteraction) {
      const actionOption = interaction.options.get("action");
      if (actionOption?.value) {
        action = String(actionOption.value) as 'lock' | 'unlock';
      }
      
      const targetOption = interaction.options.get("target");
      if (targetOption?.value) {
        target = String(targetOption.value) as 'channel' | 'category' | 'server';
      }
      
      const reasonOption = interaction.options.get("reason");
      if (reasonOption?.value) {
        reason = String(reasonOption.value);
      }
      
      // Defer reply since this might take time for server-wide operations
      await interaction.deferReply();
    } else {
      // Parse message command arguments
      if (!args || args.length < 2) {
        return interaction.reply("❌ Usage: !lockdown <lock/unlock> <channel/category/server> [reason]");
      }
      
      // Validate action
      if (args[0].toLowerCase() === 'lock' || args[0].toLowerCase() === 'on') {
        action = 'lock';
      } else if (args[0].toLowerCase() === 'unlock' || args[0].toLowerCase() === 'off') {
        action = 'unlock';
      } else {
        return interaction.reply("❌ Invalid action. Use 'lock' or 'unlock'");
      }
      
      // Validate target
      if (args[1].toLowerCase() === 'channel' || args[1].toLowerCase() === 'ch') {
        target = 'channel';
      } else if (args[1].toLowerCase() === 'category' || args[1].toLowerCase() === 'cat') {
        target = 'category';
      } else if (args[1].toLowerCase() === 'server' || args[1].toLowerCase() === 'all' || args[1].toLowerCase() === 'guild') {
        target = 'server';
      } else {
        return interaction.reply("❌ Invalid target. Use 'channel', 'category', or 'server'");
      }
      
      // Get reason if provided
      if (args.length > 2) {
        reason = args.slice(2).join(" ");
      }
    }
    
    try {
      const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
      
      if (!guild) {
        const errorMsg = "❌ This command can only be used in a server.";
        if (interaction instanceof CommandInteraction) {
          return await interaction.editReply(errorMsg);
        } else {
          return await interaction.reply(errorMsg);
        }
      }
      
      // Get the @everyone role for permission updates
      const everyoneRole = guild.roles.everyone;
      
      // Check if the bot has the necessary permissions
      const botMember = guild.members.cache.get(interaction.client.user.id);
      if (!botMember?.permissions.has(PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageRoles)) {
        const errorMsg = "❌ I don't have the necessary permissions to manage channels.";
        if (interaction instanceof CommandInteraction) {
          return await interaction.editReply(errorMsg);
        } else {
          return await interaction.reply(errorMsg);
        }
      }
      
      let successCount = 0;
      let failCount = 0;
      let affectedChannels: TextChannel[] = [];
      
      // Determine the permission update to apply
      const permissionUpdate = {
        SendMessages: action === 'lock' ? false : null,
        AddReactions: action === 'lock' ? false : null
      };
      
      switch (target) {
        case 'channel': {
          // Lock/unlock just the current channel
          const channel = interaction instanceof Message ? 
            interaction.channel as TextChannel : 
            interaction.channel as TextChannel;
          
          if (!channel || !channel.isTextBased() || channel.isDMBased()) {
            const errorMsg = "❌ This command can only be used in text channels.";
            if (interaction instanceof CommandInteraction) {
              return await interaction.editReply(errorMsg);
            } else {
              return await interaction.reply(errorMsg);
            }
          }
          
          await channel.permissionOverwrites.edit(everyoneRole, permissionUpdate);
          affectedChannels.push(channel);
          successCount++;
          break;
        }
        
        case 'category': {
          // Lock/unlock all channels in the same category
          const channel = interaction instanceof Message ? 
            interaction.channel as TextChannel : 
            interaction.channel as TextChannel;
          
          if (!channel || !channel.isTextBased() || channel.isDMBased() || !channel.parent) {
            const errorMsg = "❌ This channel is not in a category.";
            if (interaction instanceof CommandInteraction) {
              return await interaction.editReply(errorMsg);
            } else {
              return await interaction.reply(errorMsg);
            }
          }
          
          const category = channel.parent;
          const channels = category.children.cache.filter(
            ch => ch.isTextBased() && !ch.isVoiceBased()
          );
          
          for (const [_, childChannel] of channels) {
            try {
              await childChannel.permissionOverwrites.edit(everyoneRole, permissionUpdate);
              if (childChannel.isTextBased() && !childChannel.isDMBased()) {
                affectedChannels.push(childChannel as TextChannel);
              }
              successCount++;
            } catch (err) {
              console.error(`Failed to ${action} channel ${childChannel.name}:`, err);
              failCount++;
            }
          }
          break;
        }
        
        case 'server': {
          // Lock/unlock all text channels in the server
          // This can be resource-intensive on large servers
          
          // Check if user has administrator permission for server-wide action
          const member = interaction instanceof Message ? 
            interaction.member as GuildMember : 
            interaction.member as GuildMember;
          
          if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
            const errorMsg = "❌ You need Administrator permission to lock down the entire server.";
            if (interaction instanceof CommandInteraction) {
              return await interaction.editReply(errorMsg);
            } else {
              return await interaction.reply(errorMsg);
            }
          }
          
          // Get all text channels
          const textChannels = guild.channels.cache.filter(
            ch => ch.isTextBased() && !ch.isDMBased()
          );
          
          for (const [_, channel] of textChannels) {
            try {
              await channel.permissionOverwrites.edit(everyoneRole, permissionUpdate);
              if (channel.isTextBased() && !channel.isDMBased()) {
                affectedChannels.push(channel as TextChannel);
              }
              successCount++;
            } catch (err) {
              console.error(`Failed to ${action} channel ${channel.name}:`, err);
              failCount++;
            }
          }
          break;
        }
      }
      
      // Create embed for response
      const statusEmbed = new EmbedBuilder()
        .setTitle(`🔒 Server ${action === 'lock' ? 'Lockdown' : 'Unlock'}`)
        .setDescription(`The ${target} has been ${action === 'lock' ? 'locked down' : 'unlocked'}.`)
        .addFields(
          { name: '✅ Success', value: `${successCount} channel(s) ${action === 'lock' ? 'locked' : 'unlocked'}`, inline: true },
          { name: '❌ Failed', value: `${failCount} channel(s)`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setColor(action === 'lock' ? 0xFF0000 : 0x00FF00)
        .setTimestamp();
      
      // Add affected channels if not too many
      if (affectedChannels.length <= 10) {
        statusEmbed.addFields({
          name: 'Affected Channels',
          value: affectedChannels.map(ch => `#${ch.name}`).join('\n') || 'None'
        });
      } else {
        statusEmbed.addFields({
          name: 'Affected Channels',
          value: `${affectedChannels.length} channels were affected`
        });
      }
      
      // Send announcement in the channel(s) if locking down
      if (action === 'lock' && target !== 'server') {
        const announceEmbed = new EmbedBuilder()
          .setTitle('🔒 Channel Locked')
          .setDescription(`This channel has been locked by a moderator.`)
          .addFields({ name: 'Reason', value: reason })
          .setColor(0xFF0000)
          .setTimestamp();
        
        if (target === 'channel') {
          const channel = interaction instanceof Message ? 
            interaction.channel as TextChannel : 
            interaction.channel as TextChannel;
          
          if (channel && channel.isTextBased() && !channel.isDMBased()) {
            await channel.send({ embeds: [announceEmbed] });
          }
        } else if (target === 'category') {
          for (const channel of affectedChannels) {
            try {
              await channel.send({ embeds: [announceEmbed] });
            } catch (err) {
              // Silently fail if we can't send to a channel
            }
          }
        }
      }
      
      // Respond to the command
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [statusEmbed] });
      } else {
        await interaction.reply({ embeds: [statusEmbed] });
      }
      
    } catch (error) {
      console.error(`Error in lockdown command:`, error);
      const errorMsg = `❌ An error occurred while ${action === 'lock' ? 'locking' : 'unlocking'} the ${target}.`;
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  }
} as DiscordCommand;
