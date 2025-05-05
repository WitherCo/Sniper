import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextChannel,
  GuildMember,
  ChannelType,
  Guild,
  Role,
  Collection,
  GuildBasedChannel
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { handleOwnerOnlyCommand } from "../../utils/ownerCheck";

export default {
  name: "serverlockdown",
  description: "Completely lock down or unlock a server in case of raid or emergency",
  category: "admin",
  aliases: ["serverlock", "emergency", "raid-mode", "panic"],
  slash: true,
  prefix: true,
  cooldown: 60, // Long cooldown due to the impact of this command
  permissions: ["Administrator"],
  options: [
    {
      name: "action",
      description: "Lock or unlock the server",
      type: "STRING",
      required: true,
      choices: [
        { name: "Lock", value: "lock" },
        { name: "Unlock", value: "unlock" }
      ]
    },
    {
      name: "reason",
      description: "Reason for the server lockdown",
      type: "STRING",
      required: false
    },
    {
      name: "announce",
      description: "Should an announcement be sent to the server?",
      type: "BOOLEAN",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get the command name for owner check
    const commandName = "serverlockdown";
    
    // Check if this is an owner-only command and if the user has permissions
    const canContinue = await handleOwnerOnlyCommand(interaction, commandName);
    if (!canContinue) return;
    
    let action: 'lock' | 'unlock' = 'lock';
    let reason = "No reason provided";
    let shouldAnnounce = true;

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
      
      const announceOption = interaction.options.get("announce");
      if (announceOption?.value !== undefined) {
        shouldAnnounce = Boolean(announceOption.value);
      }
      
      // Defer reply as this will take time
      await interaction.deferReply();
    } else {
      // Message command format: !serverlockdown <lock|unlock> [reason] [--no-announce]
      if (!args || args.length < 1) {
        return interaction.reply("❌ Usage: !serverlockdown <lock|unlock> [reason] [--no-announce]");
      }
      
      // Parse action
      if (args[0].toLowerCase() === 'lock' || args[0].toLowerCase() === 'on' || args[0].toLowerCase() === 'true') {
        action = 'lock';
      } else if (args[0].toLowerCase() === 'unlock' || args[0].toLowerCase() === 'off' || args[0].toLowerCase() === 'false') {
        action = 'unlock';
      } else {
        return interaction.reply("❌ Invalid action. Use 'lock' or 'unlock'");
      }
      
      // Check for announcement flag
      const noAnnounceIndex = args.findIndex(arg => 
        arg.toLowerCase() === '--no-announce' || arg.toLowerCase() === '-na'
      );
      
      if (noAnnounceIndex !== -1) {
        shouldAnnounce = false;
        args.splice(noAnnounceIndex, 1); // Remove the flag from args
      }
      
      // Parse reason (everything after action, except flags)
      if (args.length > 1) {
        reason = args.slice(1).join(" ");
      }
    }
    
    // Get the guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    
    if (!guild) {
      const errorMsg = "❌ This command can only be used in a server.";
      if (interaction instanceof CommandInteraction) {
        return await interaction.editReply(errorMsg);
      } else {
        return await interaction.reply(errorMsg);
      }
    }
    
    // Check if the bot has the necessary permissions
    const botMember = guild.members.cache.get(interaction.client.user.id);
    if (!botMember?.permissions.has(PermissionFlagsBits.Administrator)) {
      const errorMsg = "❌ I need Administrator permission to execute a server lockdown.";
      if (interaction instanceof CommandInteraction) {
        return await interaction.editReply(errorMsg);
      } else {
        return await interaction.reply(errorMsg);
      }
    }
    
    // Validate user permissions
    const member = interaction instanceof Message ? 
      interaction.member as GuildMember : 
      interaction.member as GuildMember;
    
    if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
      const errorMsg = "❌ You need Administrator permission to use this command.";
      if (interaction instanceof CommandInteraction) {
        return await interaction.editReply(errorMsg);
      } else {
        return await interaction.reply(errorMsg);
      }
    }
    
    try {
      // Prepare status report
      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;
      
      // Get the @everyone role for permission updates
      const everyoneRole = guild.roles.everyone;
      
      // Send an initial status message
      const statusMessage = `🔒 **Server ${action === 'lock' ? 'Lockdown' : 'Unlock'} in Progress**\n` +
                           `This may take some time for a large server. Please wait...`;
      
      let responseMessage: Message | null = null;
      if (interaction instanceof Message) {
        responseMessage = await interaction.reply({ content: statusMessage }) as Message;
      }
      
      // Create a log of all changes
      const lockdownLog: string[] = [];
      
      // 1. Process Text Channels
      lockdownLog.push(`**${action === 'lock' ? 'Locking' : 'Unlocking'} Text Channels...**`);
      const textChannelResults = await processTextChannels(guild, everyoneRole, action);
      successCount += textChannelResults.success;
      failCount += textChannelResults.fail;
      skippedCount += textChannelResults.skipped;
      lockdownLog.push(textChannelResults.log);
      
      // 2. Process Voice Channels (if locking down)
      lockdownLog.push(`**${action === 'lock' ? 'Restricting' : 'Restoring'} Voice Channels...**`);
      const voiceChannelResults = await processVoiceChannels(guild, everyoneRole, action);
      successCount += voiceChannelResults.success;
      failCount += voiceChannelResults.fail;
      skippedCount += voiceChannelResults.skipped;
      lockdownLog.push(voiceChannelResults.log);
      
      // 3. Disable Invites if locking down
      lockdownLog.push(`**${action === 'lock' ? 'Disabling' : 'Enabling'} Server Invites...**`);
      const inviteResults = await processServerInvites(guild, action);
      lockdownLog.push(inviteResults.log);
      
      // 4. Optionally make an announcement in system channel or first available channel
      if (shouldAnnounce) {
        const announceChannel = await findAnnouncementChannel(guild);
        if (announceChannel) {
          const announceEmbed = new EmbedBuilder()
            .setTitle(action === 'lock' ? '🔒 SERVER LOCKDOWN ACTIVATED' : '🔓 SERVER LOCKDOWN LIFTED')
            .setDescription(action === 'lock' 
              ? 'This server has been placed under emergency lockdown. All channel access has been restricted.'
              : 'The server lockdown has been lifted. Regular permissions have been restored.')
            .addFields({ name: 'Reason', value: reason })
            .setColor(action === 'lock' ? 0xFF0000 : 0x00FF00)
            .setTimestamp();
          
          try {
            await announceChannel.send({ embeds: [announceEmbed] });
            lockdownLog.push(`✅ Announcement sent to #${announceChannel.name}`);
          } catch (err) {
            lockdownLog.push(`❌ Failed to send announcement to #${announceChannel.name}`);
          }
        } else {
          lockdownLog.push(`⚠️ No suitable channel found for announcements`);
        }
      }
      
      // Create final report embed
      const reportEmbed = new EmbedBuilder()
        .setTitle(`${action === 'lock' ? '🔒 Server Lockdown Complete' : '🔓 Server Unlock Complete'}`)
        .setDescription(`The server ${action === 'lock' ? 'lockdown' : 'unlock'} has been completed.`)
        .addFields(
          { name: '✅ Success', value: `${successCount} channel(s)`, inline: true },
          { name: '❌ Failed', value: `${failCount} channel(s)`, inline: true },
          { name: '⏭️ Skipped', value: `${skippedCount} channel(s)`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setColor(action === 'lock' ? 0xFF0000 : 0x00FF00)
        .setTimestamp();
      
      // Send detailed log as a separate message if it's too large
      const fullLog = lockdownLog.join('\n\n');
      
      // Send or edit response
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({ embeds: [reportEmbed] });
        
        // Send log as follow-up if it's not too long
        if (fullLog.length <= 2000) {
          await interaction.followUp({ content: fullLog, ephemeral: true });
        } else {
          await interaction.followUp({ 
            content: "The detailed log is too large to display. Check the console for full details.", 
            ephemeral: true 
          });
          console.log("SERVER LOCKDOWN LOG:", fullLog);
        }
      } else if (responseMessage) {
        await responseMessage.edit({ content: null, embeds: [reportEmbed] });
        
        // Send log as a separate message
        if (fullLog.length <= 2000) {
          await interaction.channel?.send({ content: fullLog });
        } else {
          await interaction.channel?.send("The detailed log is too large to display. Check the console for full details.");
          console.log("SERVER LOCKDOWN LOG:", fullLog);
        }
      }
    } catch (error) {
      console.error("Error in serverlockdown command:", error);
      const errorMsg = `❌ An error occurred during the server ${action === 'lock' ? 'lockdown' : 'unlock'} operation.`;
      
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  }
} as DiscordCommand;

// Helper function to process text channels
async function processTextChannels(
  guild: Guild, 
  everyoneRole: Role, 
  action: 'lock' | 'unlock'
): Promise<{ success: number, fail: number, skipped: number, log: string }> {
  let success = 0;
  let fail = 0;
  let skipped = 0;
  const log: string[] = [];
  
  const permissionUpdates = {
    SendMessages: action === 'lock' ? false : null,
    AddReactions: action === 'lock' ? false : null,
    CreatePublicThreads: action === 'lock' ? false : null,
    CreatePrivateThreads: action === 'lock' ? false : null,
    SendMessagesInThreads: action === 'lock' ? false : null
  };
  
  try {
    // Get all text channels
    const textChannels = guild.channels.cache.filter(
      channel => channel.type === ChannelType.GuildText || 
                channel.type === ChannelType.GuildAnnouncement ||
                channel.type === ChannelType.GuildForum
    );
    
    for (const [id, channel] of textChannels) {
      try {
        // Skip channels that shouldn't be affected (log channels, etc.)
        if (
          channel.name.includes('log') || 
          channel.name.includes('admin') || 
          channel.name.includes('mod-') ||
          channel.name.includes('bot-')
        ) {
          log.push(`⏭️ Skipped #${channel.name} (protected channel)`);
          skipped++;
          continue;
        }
        
        await channel.permissionOverwrites.edit(everyoneRole, permissionUpdates);
        log.push(`✅ ${action === 'lock' ? 'Locked' : 'Unlocked'} #${channel.name}`);
        success++;
      } catch (err) {
        log.push(`❌ Failed to ${action === 'lock' ? 'lock' : 'unlock'} #${channel.name}`);
        fail++;
      }
    }
  } catch (err) {
    log.push(`❌ Error processing text channels: ${err}`);
  }
  
  return { 
    success, 
    fail, 
    skipped, 
    log: log.join('\n') 
  };
}

// Helper function to process voice channels
async function processVoiceChannels(
  guild: Guild, 
  everyoneRole: Role, 
  action: 'lock' | 'unlock'
): Promise<{ success: number, fail: number, skipped: number, log: string }> {
  let success = 0;
  let fail = 0;
  let skipped = 0;
  const log: string[] = [];
  
  const permissionUpdates = {
    Connect: action === 'lock' ? false : null,
    Speak: action === 'lock' ? false : null
  };
  
  try {
    // Get all voice channels
    const voiceChannels = guild.channels.cache.filter(
      channel => channel.type === ChannelType.GuildVoice || 
                channel.type === ChannelType.GuildStageVoice
    );
    
    for (const [id, channel] of voiceChannels) {
      try {
        // Skip channels that shouldn't be affected
        if (
          channel.name.includes('admin') || 
          channel.name.includes('mod-') ||
          channel.name.includes('staff')
        ) {
          log.push(`⏭️ Skipped 🔊 ${channel.name} (protected channel)`);
          skipped++;
          continue;
        }
        
        await channel.permissionOverwrites.edit(everyoneRole, permissionUpdates);
        log.push(`✅ ${action === 'lock' ? 'Restricted' : 'Restored'} 🔊 ${channel.name}`);
        success++;
      } catch (err) {
        log.push(`❌ Failed to ${action === 'lock' ? 'restrict' : 'restore'} 🔊 ${channel.name}`);
        fail++;
      }
    }
  } catch (err) {
    log.push(`❌ Error processing voice channels: ${err}`);
  }
  
  return { 
    success, 
    fail, 
    skipped, 
    log: log.join('\n') 
  };
}

// Helper function to process server invites
async function processServerInvites(
  guild: Guild, 
  action: 'lock' | 'unlock'
): Promise<{ success: number, fail: number, log: string }> {
  let success = 0;
  let fail = 0;
  const log: string[] = [];
  
  try {
    if (action === 'lock') {
      // Delete all guild invites
      const invites = await guild.invites.fetch();
      for (const [code, invite] of invites) {
        try {
          await invite.delete(`Server lockdown activated`);
          log.push(`✅ Deleted invite code: ${code}`);
          success++;
        } catch (err) {
          log.push(`❌ Failed to delete invite code: ${code}`);
          fail++;
        }
      }
    } else {
      // When unlocking, we don't recreate invites that were deleted
      log.push(`ℹ️ Invites must be manually recreated after unlocking.`);
    }
  } catch (err) {
    log.push(`❌ Error processing server invites: ${err}`);
  }
  
  return { 
    success, 
    fail, 
    log: log.join('\n') 
  };
}

// Helper function to find a channel for announcements
async function findAnnouncementChannel(guild: Guild): Promise<TextChannel | null> {
  // First check the system channel
  if (guild.systemChannel && guild.systemChannel.type === ChannelType.GuildText) {
    return guild.systemChannel;
  }
  
  // Then check for common announcement channel names
  const announcementChannelNames = [
    'announcements', 'announcement', 'general', 'main', 'chat', 
    'info', 'information', 'updates', 'lobby', 'welcome'
  ];
  
  for (const name of announcementChannelNames) {
    const channel = guild.channels.cache.find(
      ch => ch.name.includes(name) && 
           ch.type === ChannelType.GuildText
    ) as TextChannel | undefined;
    
    if (channel) {
      return channel;
    }
  }
  
  // If all else fails, use the first text channel
  const firstTextChannel = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildText
  ) as TextChannel | undefined;
  
  return firstTextChannel || null;
}