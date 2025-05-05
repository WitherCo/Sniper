import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ChannelType,
  Guild,
  TextChannel,
  CategoryChannel,
  PermissionFlagsBits,
  GuildMemberRoleManager,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
  ModalSubmitInteraction,
  MessageActionRowComponentBuilder,
  Role,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

// Store ticket settings for each guild
interface TicketSettings {
  enabled: boolean;
  categoryId: string | null;
  logsChannelId: string | null;
  supportRoleIds: string[];
  ticketMessage: string;
  ticketTitle: string;
  ticketWelcomeMessage: string;
  ticketColor: number;
  maxTicketsPerUser: number;
  closeOnInactivity: boolean;
  inactivityTimeout: number; // in hours
  useModal: boolean;
  modalTitle: string;
  modalFields: ModalField[];
  autoCloseTickets: boolean;
  autoTranscript: boolean;
  buttonColor: ButtonStyle;
  buttonEmoji: string | null;
  buttonLabel: string;
}

interface ModalField {
  id: string;
  label: string;
  style: TextInputStyle;
  placeholder: string;
  required: boolean;
  minLength: number;
  maxLength: number;
}

// Map to track open tickets
interface TicketData {
  userId: string;
  channelId: string;
  guildId: string;
  createdAt: number;
  lastActivity: number;
  closed: boolean;
  claimed: boolean;
  claimedBy: string | null;
}

const guildTicketSettings = new Map<string, TicketSettings>();
const openTickets = new Map<string, TicketData>(); // Key: channelId

// Default ticket settings
function getDefaultSettings(): TicketSettings {
  return {
    enabled: false,
    categoryId: null,
    logsChannelId: null,
    supportRoleIds: [],
    ticketMessage: "Click the button below to create a support ticket.",
    ticketTitle: "Support Tickets",
    ticketWelcomeMessage: "Thank you for creating a ticket. Please describe your issue and wait for a staff member to assist you.",
    ticketColor: 0x5865F2,
    maxTicketsPerUser: 1,
    closeOnInactivity: false,
    inactivityTimeout: 24,
    useModal: false,
    modalTitle: "Create a ticket",
    modalFields: [
      {
        id: "ticket_subject",
        label: "Subject",
        style: TextInputStyle.Short,
        placeholder: "Enter the subject of your ticket",
        required: true,
        minLength: 3,
        maxLength: 100
      },
      {
        id: "ticket_description",
        label: "Description",
        style: TextInputStyle.Paragraph,
        placeholder: "Please describe your issue in detail",
        required: true,
        minLength: 10,
        maxLength: 1000
      }
    ],
    autoCloseTickets: false,
    autoTranscript: true,
    buttonColor: ButtonStyle.Primary,
    buttonEmoji: "🎫",
    buttonLabel: "Create Ticket"
  };
}

// Get settings for a guild
function getSettings(guildId: string): TicketSettings {
  if (!guildTicketSettings.has(guildId)) {
    guildTicketSettings.set(guildId, getDefaultSettings());
  }
  return guildTicketSettings.get(guildId)!;
}

export default {
  name: "setuptickets",
  description: "Configure and set up the ticket system",
  category: "admin",
  aliases: ["ticketsetup", "configtickets"],
  slash: false,
  prefix: true,
  cooldown: 10,
  permissions: ["Administrator"],
  options: [
    {
      name: "enable",
      description: "Enable or disable the ticket system",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "category",
      description: "Select a category for tickets",
      type: "CHANNEL",
      required: false
    },
    {
      name: "logchannel",
      description: "Select a channel for ticket logs",
      type: "CHANNEL",
      required: false
    },
    {
      name: "supportrole",
      description: "Select a support role",
      type: "ROLE",
      required: false
    },
    {
      name: "message",
      description: "Set the ticket creation message",
      type: "STRING",
      required: false
    },
    {
      name: "title",
      description: "Set the ticket embed title",
      type: "STRING",
      required: false
    },
    {
      name: "welcome",
      description: "Set the welcome message for new tickets",
      type: "STRING",
      required: false
    },
    {
      name: "color",
      description: "Set the ticket embed color (hex code)",
      type: "STRING",
      required: false
    },
    {
      name: "buttonlabel",
      description: "Set the ticket creation button label",
      type: "STRING",
      required: false
    },
    {
      name: "buttoncolor",
      description: "Set the ticket button color",
      type: "STRING",
      required: false,
      choices: [
        { name: "Primary (Blurple)", value: "primary" },
        { name: "Secondary (Grey)", value: "secondary" },
        { name: "Success (Green)", value: "success" },
        { name: "Danger (Red)", value: "danger" }
      ]
    },
    {
      name: "buttonemoji",
      description: "Set the ticket button emoji",
      type: "STRING",
      required: false
    },
    {
      name: "send",
      description: "Send the ticket creation message to a channel",
      type: "CHANNEL",
      required: false
    },
    {
      name: "usemodal",
      description: "Use a modal form for ticket creation",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "maxticketsperuser",
      description: "Maximum number of tickets a user can have open at once",
      type: "INTEGER",
      required: false
    },
    {
      name: "reset",
      description: "Reset ticket settings to default",
      type: "BOOLEAN",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Get guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Load current settings
    const settings = getSettings(guild.id);
    
    // Process slash command options
    if (interaction instanceof CommandInteraction) {
      const options = interaction.options;
      
      // Check for reset
      if (options.getBoolean("reset")) {
        guildTicketSettings.set(guild.id, getDefaultSettings());
        return interaction.reply({
          content: "✅ Ticket settings have been reset to defaults.",
          ephemeral: true
        });
      }
      
      // Update settings from options
      let updated = false;
      
      // Toggle enabled state
      const enable = options.getBoolean("enable");
      if (enable !== null) {
        settings.enabled = enable;
        updated = true;
      }
      
      // Update category
      const category = options.getChannel("category");
      if (category) {
        if (category.type !== ChannelType.GuildCategory) {
          return interaction.reply({
            content: "❌ The ticket category must be a category channel.",
            ephemeral: true
          });
        }
        settings.categoryId = category.id;
        updated = true;
      }
      
      // Update logs channel
      const logChannel = options.getChannel("logchannel");
      if (logChannel) {
        if (logChannel.type !== ChannelType.GuildText) {
          return interaction.reply({
            content: "❌ The logs channel must be a text channel.",
            ephemeral: true
          });
        }
        settings.logsChannelId = logChannel.id;
        updated = true;
      }
      
      // Update support role
      const supportRole = options.getRole("supportrole");
      if (supportRole) {
        // Add role if not already in the list
        if (!settings.supportRoleIds.includes(supportRole.id)) {
          settings.supportRoleIds.push(supportRole.id);
          updated = true;
        }
      }
      
      // Update ticket message
      const message = options.getString("message");
      if (message !== null) {
        settings.ticketMessage = message;
        updated = true;
      }
      
      // Update ticket title
      const title = options.getString("title");
      if (title !== null) {
        settings.ticketTitle = title;
        updated = true;
      }
      
      // Update welcome message
      const welcome = options.getString("welcome");
      if (welcome !== null) {
        settings.ticketWelcomeMessage = welcome;
        updated = true;
      }
      
      // Update color
      const color = options.getString("color");
      if (color) {
        try {
          // Parse hex color
          const colorInt = parseInt(color.replace("#", ""), 16);
          settings.ticketColor = colorInt;
          updated = true;
        } catch (error) {
          return interaction.reply({
            content: "❌ Invalid color format. Please use a hex color code like #5865F2.",
            ephemeral: true
          });
        }
      }
      
      // Update button label
      const buttonLabel = options.getString("buttonlabel");
      if (buttonLabel !== null) {
        settings.buttonLabel = buttonLabel;
        updated = true;
      }
      
      // Update button color
      const buttonColor = options.getString("buttoncolor");
      if (buttonColor) {
        switch (buttonColor) {
          case "primary":
            settings.buttonColor = ButtonStyle.Primary;
            break;
          case "secondary":
            settings.buttonColor = ButtonStyle.Secondary;
            break;
          case "success":
            settings.buttonColor = ButtonStyle.Success;
            break;
          case "danger":
            settings.buttonColor = ButtonStyle.Danger;
            break;
        }
        updated = true;
      }
      
      // Update button emoji
      const buttonEmoji = options.getString("buttonemoji");
      if (buttonEmoji !== null) {
        settings.buttonEmoji = buttonEmoji;
        updated = true;
      }
      
      // Update max tickets per user
      const maxTickets = options.getInteger("maxticketsperuser");
      if (maxTickets !== null) {
        if (maxTickets < 1) {
          return interaction.reply({
            content: "❌ Maximum tickets per user must be at least 1.",
            ephemeral: true
          });
        }
        settings.maxTicketsPerUser = maxTickets;
        updated = true;
      }
      
      // Update useModal setting
      const useModal = options.getBoolean("usemodal");
      if (useModal !== null) {
        settings.useModal = useModal;
        updated = true;
      }
      
      // Save settings
      if (updated) {
        guildTicketSettings.set(guild.id, settings);
      }
      
      // Send ticket creation message if requested
      const sendChannel = options.getChannel("send");
      if (sendChannel) {
        if (sendChannel.type !== ChannelType.GuildText) {
          return interaction.reply({
            content: "❌ You can only send the ticket message to a text channel.",
            ephemeral: true
          });
        }
        
        await sendTicketMessage(sendChannel as TextChannel, settings);
        
        return interaction.reply({
          content: `✅ Ticket creation message has been sent to ${sendChannel}.`,
          ephemeral: true
        });
      }
      
      // If no options were provided or just updated settings, show current settings
      return showSettings(interaction, guild, settings, updated);
    } 
    // Process message command arguments
    else {
      // If no args, show current settings
      if (!args || args.length === 0) {
        return showSettings(interaction, guild, settings);
      }
      
      // Process command arguments
      const subcommand = args[0].toLowerCase();
      
      switch (subcommand) {
        case "enable":
        case "on":
          settings.enabled = true;
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply("✅ Ticket system has been enabled.");
          
        case "disable":
        case "off":
          settings.enabled = false;
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply("✅ Ticket system has been disabled.");
          
        case "category":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a category ID.");
          }
          
          // Get category from ID
          const categoryId = args[1].replace(/[<#>]/g, "");
          const category = guild.channels.cache.get(categoryId);
          
          if (!category || category.type !== ChannelType.GuildCategory) {
            return interaction.reply("❌ Invalid category specified.");
          }
          
          settings.categoryId = category.id;
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply(`✅ Ticket category set to ${category.name}.`);
          
        case "logchannel":
        case "logs":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a channel.");
          }
          
          // Get channel from mention or ID
          const channelArg = args[1].replace(/[<#>]/g, "");
          const channel = guild.channels.cache.get(channelArg);
          
          if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply("❌ Invalid text channel specified.");
          }
          
          settings.logsChannelId = channel.id;
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply(`✅ Ticket logs channel set to ${channel}.`);
          
        case "addrole":
        case "supportrole":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a role.");
          }
          
          // Get role from mention or ID
          const roleArg = args[1].replace(/[<@&>]/g, "");
          const role = guild.roles.cache.get(roleArg);
          
          if (!role) {
            return interaction.reply("❌ Invalid role specified.");
          }
          
          // Add role if not already in the list
          if (!settings.supportRoleIds.includes(role.id)) {
            settings.supportRoleIds.push(role.id);
            guildTicketSettings.set(guild.id, settings);
            return interaction.reply(`✅ Added ${role.name} to support roles.`);
          } else {
            return interaction.reply(`❓ ${role.name} is already a support role.`);
          }
          
        case "removerole":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a role.");
          }
          
          // Get role from mention or ID
          const removeRoleArg = args[1].replace(/[<@&>]/g, "");
          const removeRole = guild.roles.cache.get(removeRoleArg);
          
          if (!removeRole) {
            return interaction.reply("❌ Invalid role specified.");
          }
          
          // Remove role if in the list
          const roleIndex = settings.supportRoleIds.indexOf(removeRole.id);
          if (roleIndex !== -1) {
            settings.supportRoleIds.splice(roleIndex, 1);
            guildTicketSettings.set(guild.id, settings);
            return interaction.reply(`✅ Removed ${removeRole.name} from support roles.`);
          } else {
            return interaction.reply(`❓ ${removeRole.name} is not a support role.`);
          }
          
        case "message":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a message.");
          }
          
          settings.ticketMessage = args.slice(1).join(" ");
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply("✅ Ticket message has been updated.");
          
        case "title":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a title.");
          }
          
          settings.ticketTitle = args.slice(1).join(" ");
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply("✅ Ticket title has been updated.");
          
        case "welcome":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a welcome message.");
          }
          
          settings.ticketWelcomeMessage = args.slice(1).join(" ");
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply("✅ Ticket welcome message has been updated.");
          
        case "color":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a hex color code.");
          }
          
          try {
            const colorInt = parseInt(args[1].replace("#", ""), 16);
            settings.ticketColor = colorInt;
            guildTicketSettings.set(guild.id, settings);
            return interaction.reply("✅ Ticket color has been updated.");
          } catch (error) {
            return interaction.reply("❌ Invalid color format. Please use a hex color code like #5865F2.");
          }
          
        case "buttonlabel":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a button label.");
          }
          
          settings.buttonLabel = args.slice(1).join(" ");
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply("✅ Button label has been updated.");
          
        case "buttoncolor":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a button color (primary, secondary, success, danger).");
          }
          
          const color = args[1].toLowerCase();
          switch (color) {
            case "primary":
            case "blurple":
              settings.buttonColor = ButtonStyle.Primary;
              break;
            case "secondary":
            case "grey":
            case "gray":
              settings.buttonColor = ButtonStyle.Secondary;
              break;
            case "success":
            case "green":
              settings.buttonColor = ButtonStyle.Success;
              break;
            case "danger":
            case "red":
              settings.buttonColor = ButtonStyle.Danger;
              break;
            default:
              return interaction.reply("❌ Invalid color. Please use primary, secondary, success, or danger.");
          }
          
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply(`✅ Button color set to ${color}.`);
          
        case "buttonemoji":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify an emoji.");
          }
          
          settings.buttonEmoji = args[1];
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply("✅ Button emoji has been updated.");
          
        case "maxticketsperuser":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a number.");
          }
          
          const max = parseInt(args[1]);
          if (isNaN(max) || max < 1) {
            return interaction.reply("❌ Maximum tickets per user must be a positive number.");
          }
          
          settings.maxTicketsPerUser = max;
          guildTicketSettings.set(guild.id, settings);
          return interaction.reply(`✅ Maximum tickets per user set to ${max}.`);
          
        case "usemodal":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify 'on' or 'off'.");
          }
          
          if (["on", "true", "yes", "enable"].includes(args[1].toLowerCase())) {
            settings.useModal = true;
            guildTicketSettings.set(guild.id, settings);
            return interaction.reply("✅ Modal form for ticket creation has been enabled.");
          } else if (["off", "false", "no", "disable"].includes(args[1].toLowerCase())) {
            settings.useModal = false;
            guildTicketSettings.set(guild.id, settings);
            return interaction.reply("✅ Modal form for ticket creation has been disabled.");
          } else {
            return interaction.reply("❌ Invalid option. Use 'on' or 'off'.");
          }
          
        case "send":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a channel.");
          }
          
          // Get channel from mention or ID
          const sendChannelArg = args[1].replace(/[<#>]/g, "");
          const sendChannel = guild.channels.cache.get(sendChannelArg);
          
          if (!sendChannel || sendChannel.type !== ChannelType.GuildText) {
            return interaction.reply("❌ Invalid text channel specified.");
          }
          
          try {
            await sendTicketMessage(sendChannel as TextChannel, settings);
            return interaction.reply(`✅ Ticket creation message has been sent to ${sendChannel}.`);
          } catch (error) {
            return interaction.reply(`❌ Failed to send ticket message: ${(error as Error).message}`);
          }
          
        case "reset":
          guildTicketSettings.set(guild.id, getDefaultSettings());
          return interaction.reply("✅ Ticket settings have been reset to defaults.");
          
        default:
          return interaction.reply("❌ Unknown subcommand. Type `!setuptickets` without arguments to see current settings.");
      }
    }
  }
} as DiscordCommand;

/**
 * Show current ticket settings
 */
async function showSettings(
  interaction: CommandInteraction | Message, 
  guild: Guild, 
  settings: TicketSettings,
  updated: boolean = false
): Promise<any> {
  // Get ticket category info
  let categoryName = "Not set";
  if (settings.categoryId) {
    const category = guild.channels.cache.get(settings.categoryId);
    if (category) {
      categoryName = category.name;
    }
  }
  
  // Get logs channel info
  let logsChannel = "Not set";
  if (settings.logsChannelId) {
    const channel = guild.channels.cache.get(settings.logsChannelId);
    if (channel) {
      logsChannel = `<#${channel.id}>`;
    }
  }
  
  // Get support roles info
  let supportRoles = "None";
  if (settings.supportRoleIds.length > 0) {
    supportRoles = settings.supportRoleIds.map(id => {
      const role = guild.roles.cache.get(id);
      return role ? `<@&${role.id}>` : `Unknown role (${id})`;
    }).join(", ");
  }
  
  // Format button color name
  let buttonColorName = "Primary (Blurple)";
  switch (settings.buttonColor) {
    case ButtonStyle.Secondary:
      buttonColorName = "Secondary (Grey)";
      break;
    case ButtonStyle.Success:
      buttonColorName = "Success (Green)";
      break;
    case ButtonStyle.Danger:
      buttonColorName = "Danger (Red)";
      break;
  }
  
  // Create embed with settings
  const embed = new EmbedBuilder()
    .setTitle(`Ticket System Settings for ${guild.name}`)
    .setColor(settings.ticketColor)
    .addFields(
      { name: "Status", value: settings.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "Category", value: categoryName, inline: true },
      { name: "Logs Channel", value: logsChannel, inline: true },
      { name: "Support Roles", value: supportRoles, inline: false },
      { name: "Ticket Message", value: settings.ticketMessage, inline: false },
      { name: "Ticket Title", value: settings.ticketTitle, inline: true },
      { name: "Embed Color", value: `#${settings.ticketColor.toString(16).padStart(6, '0')}`, inline: true },
      { name: "Max Tickets Per User", value: settings.maxTicketsPerUser.toString(), inline: true },
      { name: "Use Modal Form", value: settings.useModal ? "✅ Yes" : "❌ No", inline: true },
      { name: "Button Label", value: settings.buttonLabel, inline: true },
      { name: "Button Color", value: buttonColorName, inline: true },
      { name: "Button Emoji", value: settings.buttonEmoji || "None", inline: true },
      { name: "Welcome Message", value: settings.ticketWelcomeMessage, inline: false }
    )
    .setFooter({ text: "Use /setuptickets or !setuptickets to configure" })
    .setTimestamp();
  
  // Add updated notice if needed
  if (updated) {
    embed.setDescription("✅ Settings have been updated!");
  }
  
  // Create a button to send the ticket message
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("send_ticket_message")
        .setLabel("Send Ticket Message")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📩")
    );
  
  if (interaction instanceof CommandInteraction) {
    return interaction.reply({ 
      embeds: [embed], 
      components: [row],
      ephemeral: true 
    });
  } else {
    return interaction.reply({ 
      embeds: [embed], 
      components: [row] 
    });
  }
}

/**
 * Send ticket creation message to a channel
 */
async function sendTicketMessage(
  channel: TextChannel, 
  settings: TicketSettings
): Promise<void> {
  // Create ticket embed
  const embed = new EmbedBuilder()
    .setTitle(settings.ticketTitle)
    .setDescription(settings.ticketMessage)
    .setColor(settings.ticketColor)
    .setFooter({ text: channel.guild.name, iconURL: channel.guild.iconURL() || undefined })
    .setTimestamp();
  
  // Create ticket button
  const button = new ButtonBuilder()
    .setCustomId("create_ticket")
    .setLabel(settings.buttonLabel)
    .setStyle(settings.buttonColor);
  
  // Add emoji if specified
  if (settings.buttonEmoji) {
    button.setEmoji(settings.buttonEmoji);
  }
  
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(button);
  
  // Send the message
  await channel.send({
    embeds: [embed],
    components: [row]
  });
}

// Command to manage existing tickets
export const tickets = {
  name: "tickets",
  description: "Manage the ticket system",
  category: "admin",
  aliases: ["ticketadmin", "ticketmanager"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: ["ManageGuild"],
  options: [
    {
      name: "list",
      description: "List all open tickets",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "close",
      description: "Close a ticket manually",
      type: "CHANNEL",
      required: false
    },
    {
      name: "delete",
      description: "Delete a ticket without transcript",
      type: "CHANNEL",
      required: false
    },
    {
      name: "transcript",
      description: "Generate a transcript of a ticket",
      type: "CHANNEL",
      required: false
    },
    {
      name: "stats",
      description: "View ticket statistics",
      type: "BOOLEAN",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message): Promise<any> {
    // Get guild
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    // Load ticket settings
    const settings = getSettings(guild.id);
    
    if (!settings.enabled) {
      return interaction.reply({
        content: "❌ The ticket system is not enabled on this server.",
        ephemeral: true
      });
    }
    
    // Process slash command options
    if (interaction instanceof CommandInteraction) {
      // List tickets
      if (interaction.options.getBoolean("list")) {
        return listTickets(interaction, guild);
      }
      
      // Close ticket
      const closeChannel = interaction.options.getChannel("close");
      if (closeChannel) {
        return closeTicket(interaction, closeChannel.id, guild);
      }
      
      // Delete ticket
      const deleteChannel = interaction.options.getChannel("delete");
      if (deleteChannel) {
        return deleteTicket(interaction, deleteChannel.id, guild);
      }
      
      // Transcript ticket
      const transcriptChannel = interaction.options.getChannel("transcript");
      if (transcriptChannel) {
        return generateTranscript(interaction, transcriptChannel.id, guild);
      }
      
      // Show stats
      if (interaction.options.getBoolean("stats")) {
        return showTicketStats(interaction, guild);
      }
      
      // If no options were provided, show ticket system status
      return showTicketStatus(interaction, guild, settings);
    } 
    // Process message command arguments
    else {
      if (!args || args.length === 0) {
        return showTicketStatus(interaction, guild, settings);
      }
      
      // Process subcommands
      const subcommand = args[0].toLowerCase();
      
      switch (subcommand) {
        case "list":
          return listTickets(interaction, guild);
          
        case "close":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a channel ID or mention.");
          }
          const closeChannelId = args[1].replace(/[<#>]/g, "");
          return closeTicket(interaction, closeChannelId, guild);
          
        case "delete":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a channel ID or mention.");
          }
          const deleteChannelId = args[1].replace(/[<#>]/g, "");
          return deleteTicket(interaction, deleteChannelId, guild);
          
        case "transcript":
          if (args.length < 2) {
            return interaction.reply("❌ Please specify a channel ID or mention.");
          }
          const transcriptChannelId = args[1].replace(/[<#>]/g, "");
          return generateTranscript(interaction, transcriptChannelId, guild);
          
        case "stats":
          return showTicketStats(interaction, guild);
          
        default:
          return interaction.reply("❌ Unknown subcommand. Available options: list, close, delete, transcript, stats");
      }
    }
  }
} as DiscordCommand;

/**
 * Show ticket system status
 */
async function showTicketStatus(
  interaction: CommandInteraction | Message,
  guild: Guild,
  settings: TicketSettings
): Promise<any> {
  // Count open tickets for this guild
  const guildTickets = Array.from(openTickets.values()).filter(ticket => 
    ticket.guildId === guild.id && !ticket.closed
  );
  
  // Create embed with status
  const embed = new EmbedBuilder()
    .setTitle("Ticket System Status")
    .setColor(settings.ticketColor)
    .addFields(
      { name: "Status", value: settings.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "Open Tickets", value: guildTickets.length.toString(), inline: true }
    )
    .setFooter({ text: guild.name, iconURL: guild.iconURL() || undefined })
    .setTimestamp();
  
  // Add action buttons
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("list_tickets")
        .setLabel("List Tickets")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📋"),
      new ButtonBuilder()
        .setCustomId("ticket_stats")
        .setLabel("View Stats")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊")
    );
  
  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

/**
 * List all open tickets
 */
async function listTickets(
  interaction: CommandInteraction | Message,
  guild: Guild
): Promise<any> {
  // Get all open tickets for this guild
  const guildTickets = Array.from(openTickets.values()).filter(ticket => 
    ticket.guildId === guild.id && !ticket.closed
  );
  
  if (guildTickets.length === 0) {
    return interaction.reply({
      content: "There are no open tickets in this server.",
      ephemeral: true
    });
  }
  
  // Create embed with ticket list
  const embed = new EmbedBuilder()
    .setTitle("Open Tickets")
    .setColor(0x5865F2)
    .setDescription(`There are ${guildTickets.length} open tickets in this server.`)
    .setFooter({ text: guild.name, iconURL: guild.iconURL() || undefined })
    .setTimestamp();
  
  // Add ticket info
  for (const ticket of guildTickets) {
    const channel = guild.channels.cache.get(ticket.channelId);
    if (!channel) continue;
    
    const user = await guild.client.users.fetch(ticket.userId).catch(() => null);
    const username = user ? user.tag : "Unknown User";
    
    // Format created time
    const createdTime = Math.floor(ticket.createdAt / 1000);
    
    // Format status (claimed or not)
    let status = "Unclaimed";
    if (ticket.claimed && ticket.claimedBy) {
      const claimedByUser = await guild.client.users.fetch(ticket.claimedBy).catch(() => null);
      status = `Claimed by ${claimedByUser ? claimedByUser.tag : "Unknown"}`;
    }
    
    embed.addFields({
      name: `#${channel.name}`,
      value: `Created by: ${username}\nCreated: <t:${createdTime}:R>\nStatus: ${status}\nChannel: <#${channel.id}>`,
      inline: false
    });
  }
  
  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

/**
 * Close a ticket
 */
async function closeTicket(
  interaction: CommandInteraction | Message,
  channelId: string,
  guild: Guild
): Promise<any> {
  // Check if this is a ticket channel
  if (!openTickets.has(channelId)) {
    return interaction.reply({
      content: "❌ This is not a ticket channel or it has already been closed.",
      ephemeral: true
    });
  }
  
  const ticket = openTickets.get(channelId)!;
  
  // Check if ticket belongs to this guild
  if (ticket.guildId !== guild.id) {
    return interaction.reply({
      content: "❌ This ticket belongs to another server.",
      ephemeral: true
    });
  }
  
  // Get ticket channel
  const channel = guild.channels.cache.get(channelId) as TextChannel;
  if (!channel) {
    // Ticket channel no longer exists, remove from tracking
    openTickets.delete(channelId);
    return interaction.reply({
      content: "❌ This ticket channel no longer exists.",
      ephemeral: true
    });
  }
  
  // Get settings
  const settings = getSettings(guild.id);
  
  try {
    // Generate transcript if enabled
    if (settings.autoTranscript) {
      await generateTranscript(interaction, channelId, guild, true);
    }
    
    // Mark ticket as closed
    ticket.closed = true;
    openTickets.set(channelId, ticket);
    
    // Send closing message
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Ticket Closed")
          .setDescription(`This ticket has been closed by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}.`)
          .setColor(0xE74C3C)
          .setTimestamp()
      ]
    });
    
    // Delete the channel with a delay to allow users to see the closing message
    setTimeout(async () => {
      try {
        await channel.delete(`Ticket closed by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`);
        openTickets.delete(channelId);
      } catch (error) {
        console.error(`Error deleting ticket channel: ${error}`);
      }
    }, 5000);
    
    return interaction.reply({
      content: `✅ Ticket #${channel.name} has been closed.`,
      ephemeral: true
    });
  } catch (error) {
    return interaction.reply({
      content: `❌ Failed to close ticket: ${(error as Error).message}`,
      ephemeral: true
    });
  }
}

/**
 * Delete a ticket without transcript
 */
async function deleteTicket(
  interaction: CommandInteraction | Message,
  channelId: string,
  guild: Guild
): Promise<any> {
  // Check if this is a ticket channel
  if (!openTickets.has(channelId)) {
    return interaction.reply({
      content: "❌ This is not a ticket channel or it has already been closed.",
      ephemeral: true
    });
  }
  
  const ticket = openTickets.get(channelId)!;
  
  // Check if ticket belongs to this guild
  if (ticket.guildId !== guild.id) {
    return interaction.reply({
      content: "❌ This ticket belongs to another server.",
      ephemeral: true
    });
  }
  
  // Get ticket channel
  const channel = guild.channels.cache.get(channelId) as TextChannel;
  if (!channel) {
    // Ticket channel no longer exists, remove from tracking
    openTickets.delete(channelId);
    return interaction.reply({
      content: "❌ This ticket channel no longer exists.",
      ephemeral: true
    });
  }
  
  try {
    // Delete the channel immediately
    await channel.delete(`Ticket deleted by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}`);
    openTickets.delete(channelId);
    
    return interaction.reply({
      content: `✅ Ticket #${channel.name} has been deleted.`,
      ephemeral: true
    });
  } catch (error) {
    return interaction.reply({
      content: `❌ Failed to delete ticket: ${(error as Error).message}`,
      ephemeral: true
    });
  }
}

/**
 * Generate transcript of a ticket
 */
async function generateTranscript(
  interaction: CommandInteraction | Message,
  channelId: string,
  guild: Guild,
  isAutoClose: boolean = false
): Promise<any> {
  // Check if this is a ticket channel
  if (!openTickets.has(channelId)) {
    if (!isAutoClose) {
      return interaction.reply({
        content: "❌ This is not a ticket channel or it has already been closed.",
        ephemeral: true
      });
    }
    return;
  }
  
  const ticket = openTickets.get(channelId)!;
  
  // Check if ticket belongs to this guild
  if (ticket.guildId !== guild.id) {
    if (!isAutoClose) {
      return interaction.reply({
        content: "❌ This ticket belongs to another server.",
        ephemeral: true
      });
    }
    return;
  }
  
  // Get ticket channel
  const channel = guild.channels.cache.get(channelId) as TextChannel;
  if (!channel) {
    // Ticket channel no longer exists, remove from tracking
    openTickets.delete(channelId);
    if (!isAutoClose) {
      return interaction.reply({
        content: "❌ This ticket channel no longer exists.",
        ephemeral: true
      });
    }
    return;
  }
  
  // Get ticket creator
  const creator = await guild.client.users.fetch(ticket.userId).catch(() => null);
  
  // Get settings
  const settings = getSettings(guild.id);
  
  try {
    // Fetch messages from the channel (up to 100 for demonstration)
    const messages = await channel.messages.fetch({ limit: 100 });
    
    // Create a simple transcript (in a real bot, you would create a more sophisticated transcript)
    let transcript = `# Ticket Transcript: #${channel.name}\n`;
    transcript += `Created by: ${creator ? creator.tag : "Unknown"}\n`;
    transcript += `Created at: ${new Date(ticket.createdAt).toISOString()}\n`;
    transcript += `Closed by: ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}\n`;
    transcript += `Closed at: ${new Date().toISOString()}\n\n`;
    transcript += "## Messages\n\n";
    
    // Process messages (newest first, so reverse them)
    const messagesArray = Array.from(messages.values()).reverse();
    
    for (const msg of messagesArray) {
      // Skip system messages
      if (msg.system) continue;
      
      const timestamp = new Date(msg.createdTimestamp).toISOString();
      transcript += `### ${msg.author.tag} (${timestamp})\n`;
      transcript += `${msg.content || "(No text content)"}\n\n`;
      
      // Add attachments if any
      if (msg.attachments.size > 0) {
        transcript += "**Attachments:**\n";
        msg.attachments.forEach(attachment => {
          transcript += `- ${attachment.name}: ${attachment.url}\n`;
        });
        transcript += "\n";
      }
      
      // Add embeds if any
      if (msg.embeds.length > 0) {
        transcript += "**Embeds:**\n";
        msg.embeds.forEach(embed => {
          transcript += `- ${embed.title || "Untitled Embed"}\n`;
          if (embed.description) transcript += `  ${embed.description}\n`;
        });
        transcript += "\n";
      }
    }
    
    // Find logs channel
    let logsChannel: TextChannel | null = null;
    if (settings.logsChannelId) {
      const channel = guild.channels.cache.get(settings.logsChannelId);
      if (channel && channel.type === ChannelType.GuildText) {
        logsChannel = channel as TextChannel;
      }
    }
    
    if (!logsChannel) {
      if (!isAutoClose) {
        return interaction.reply({
          content: "❌ Logs channel is not configured or no longer exists.",
          ephemeral: true
        });
      }
      return;
    }
    
    // Create transcript as file attachment
    const buffer = Buffer.from(transcript, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `ticket-${channel.name}-transcript.txt` });
    
    // Send transcript to logs channel
    await logsChannel.send({
      content: `Transcript for ticket #${channel.name}`,
      files: [attachment],
      embeds: [
        new EmbedBuilder()
          .setTitle(`Ticket Transcript: #${channel.name}`)
          .setDescription(`Ticket created by ${creator ? creator.tag : "Unknown User"} has been closed.`)
          .setColor(0x5865F2)
          .addFields(
            { name: "Created", value: `<t:${Math.floor(ticket.createdAt / 1000)}:R>`, inline: true },
            { name: "Closed", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
            { name: "Closed by", value: interaction instanceof Message ? interaction.author.tag : interaction.user.tag, inline: true }
          )
          .setTimestamp()
      ]
    });
    
    if (!isAutoClose) {
      return interaction.reply({
        content: `✅ Transcript for ticket #${channel.name} has been generated and sent to the logs channel.`,
        ephemeral: true
      });
    }
  } catch (error) {
    if (!isAutoClose) {
      return interaction.reply({
        content: `❌ Failed to generate transcript: ${(error as Error).message}`,
        ephemeral: true
      });
    }
  }
}

/**
 * Show ticket statistics
 */
async function showTicketStats(
  interaction: CommandInteraction | Message,
  guild: Guild
): Promise<any> {
  // Get all tickets for this guild
  const guildTickets = Array.from(openTickets.values()).filter(ticket => 
    ticket.guildId === guild.id
  );
  
  // Count open and closed tickets
  const openCount = guildTickets.filter(ticket => !ticket.closed).length;
  const closedCount = guildTickets.filter(ticket => ticket.closed).length;
  
  // Count claimed tickets
  const claimedCount = guildTickets.filter(ticket => ticket.claimed).length;
  
  // Get ticket creators count
  const creators = new Set(guildTickets.map(ticket => ticket.userId));
  
  // Create embed with stats
  const embed = new EmbedBuilder()
    .setTitle("Ticket System Statistics")
    .setColor(0x5865F2)
    .addFields(
      { name: "Total Tickets", value: guildTickets.length.toString(), inline: true },
      { name: "Open Tickets", value: openCount.toString(), inline: true },
      { name: "Closed Tickets", value: closedCount.toString(), inline: true },
      { name: "Claimed Tickets", value: claimedCount.toString(), inline: true },
      { name: "Unique Users", value: creators.size.toString(), inline: true }
    )
    .setFooter({ text: guild.name, iconURL: guild.iconURL() || undefined })
    .setTimestamp();
  
  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

// Export event handlers
export const handleInteractionCreate = async (interaction: ModalSubmitInteraction): Promise<void> => {
  // Handle ticket creation modal submission
  if (interaction.customId === "ticket_create_modal") {
    await handleTicketCreationModal(interaction);
  }
};

/**
 * Handle ticket creation modal submission
 */
async function handleTicketCreationModal(interaction: ModalSubmitInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;
  
  // Get settings
  const settings = getSettings(guild.id);
  
  // Get modal inputs
  const subject = interaction.fields.getTextInputValue("ticket_subject");
  const description = interaction.fields.getTextInputValue("ticket_description");
  
  try {
    // Check if user has reached max tickets
    const userTickets = Array.from(openTickets.values()).filter(ticket => 
      ticket.guildId === guild.id && 
      ticket.userId === interaction.user.id && 
      !ticket.closed
    );
    
    if (userTickets.length >= settings.maxTicketsPerUser) {
      await interaction.reply({
        content: `❌ You can only have ${settings.maxTicketsPerUser} open ticket(s) at a time.`,
        ephemeral: true
      });
      return;
    }
    
    // Create the ticket
    await createTicket(interaction, settings, subject, description);
  } catch (error) {
    console.error("Error creating ticket from modal:", error);
    await interaction.reply({
      content: `❌ Failed to create ticket: ${(error as Error).message}`,
      ephemeral: true
    });
  }
}

/**
 * Create a new ticket
 */
async function createTicket(
  interaction: any,
  settings: TicketSettings,
  subject?: string,
  description?: string
): Promise<void> {
  const guild = interaction.guild;
  
  // Check if the ticket system is enabled
  if (!settings.enabled) {
    await interaction.reply({
      content: "❌ The ticket system is currently disabled.",
      ephemeral: true
    });
    return;
  }
  
  // Check if the user has reached the max tickets limit
  const userOpenTickets = Array.from(openTickets.values()).filter(ticket => 
    ticket.guildId === guild.id && 
    ticket.userId === interaction.user.id && 
    !ticket.closed
  );
  
  if (userOpenTickets.length >= settings.maxTicketsPerUser) {
    await interaction.reply({
      content: `❌ You can only have ${settings.maxTicketsPerUser} open ticket(s) at a time.`,
      ephemeral: true
    });
    return;
  }
  
  // Get or create ticket category
  let category: CategoryChannel;
  if (settings.categoryId) {
    const existingCategory = guild.channels.cache.get(settings.categoryId);
    if (existingCategory && existingCategory.type === ChannelType.GuildCategory) {
      category = existingCategory as CategoryChannel;
    } else {
      // Create a new category if the configured one doesn't exist
      category = await guild.channels.create({
        name: "Tickets",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
      
      // Update settings with new category
      settings.categoryId = category.id;
      guildTicketSettings.set(guild.id, settings);
    }
  } else {
    // No category configured, create one
    category = await guild.channels.create({
      name: "Tickets",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
      ]
    });
    
    // Update settings with new category
    settings.categoryId = category.id;
    guildTicketSettings.set(guild.id, settings);
  }
  
  // Generate ticket name
  const ticketNumber = generateTicketNumber();
  const ticketName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}-${ticketNumber}`;
  
  // Setup permissions for the ticket channel
  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];
  
  // Add permissions for support roles
  for (const roleId of settings.supportRoleIds) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      permissionOverwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      });
    }
  }
  
  // Create the ticket channel
  const ticketChannel = await guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    parent: category,
    permissionOverwrites: permissionOverwrites,
    topic: `Ticket for ${interaction.user.tag} - Subject: ${subject || "No subject"}`
  });
  
  // Track the ticket
  openTickets.set(ticketChannel.id, {
    userId: interaction.user.id,
    channelId: ticketChannel.id,
    guildId: guild.id,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    closed: false,
    claimed: false,
    claimedBy: null
  });
  
  // Create welcome message
  const welcomeEmbed = new EmbedBuilder()
    .setTitle(`Ticket: ${subject || "New Ticket"}`)
    .setDescription(settings.ticketWelcomeMessage)
    .setColor(settings.ticketColor)
    .addFields(
      { name: "Created by", value: interaction.user.toString(), inline: true },
      { name: "Ticket ID", value: `#${ticketNumber}`, inline: true }
    )
    .setFooter({ text: guild.name, iconURL: guild.iconURL() || undefined })
    .setTimestamp();
  
  // Add user's description if provided
  if (description) {
    welcomeEmbed.addFields({ name: "Description", value: description, inline: false });
  }
  
  // Create ticket management buttons
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("claim_ticket")
        .setLabel("Claim")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔒"),
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("❌")
    );
  
  // Send welcome message to the ticket channel
  await ticketChannel.send({
    content: `${interaction.user.toString()} ${settings.supportRoleIds.map(id => `<@&${id}>`).join(" ")}`,
    embeds: [welcomeEmbed],
    components: [row]
  });
  
  // Send confirmation to user
  await interaction.reply({
    content: `✅ Your ticket has been created! Please check ${ticketChannel.toString()}.`,
    ephemeral: true
  });
  
  // Send notification to logs channel if configured
  if (settings.logsChannelId) {
    const logsChannel = guild.channels.cache.get(settings.logsChannelId) as TextChannel;
    if (logsChannel && logsChannel.type === ChannelType.GuildText) {
      const logEmbed = new EmbedBuilder()
        .setTitle("Ticket Created")
        .setDescription(`A new ticket has been created by ${interaction.user.tag}.`)
        .setColor(settings.ticketColor)
        .addFields(
          { name: "User", value: interaction.user.toString(), inline: true },
          { name: "Ticket", value: ticketChannel.toString(), inline: true },
          { name: "Subject", value: subject || "No subject", inline: false }
        )
        .setFooter({ text: `Ticket ID: ${ticketNumber}` })
        .setTimestamp();
      
      await logsChannel.send({ embeds: [logEmbed] });
    }
  }
}

/**
 * Generate a random ticket number
 */
function generateTicketNumber(): string {
  // Generate a random 4-digit number
  return Math.floor(1000 + Math.random() * 9000).toString();
}