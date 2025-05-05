import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  TextChannel,
  User,
  PermissionFlagsBits,
  Collection,
  GuildTextBasedChannel,
  ChannelType
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { config } from "../../config";

export default {
  name: "clean",
  description: "Delete messages from a channel",
  category: "moderation",
  aliases: ["clear", "purge", "prune"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: ["ManageMessages"],
  options: [
    {
      name: "amount",
      description: "Number of messages to delete (1-100)",
      type: "INTEGER",
      required: true
    },
    {
      name: "user",
      description: "Only delete messages from this user",
      type: "USER",
      required: false
    },
    {
      name: "contains",
      description: "Only delete messages containing this text",
      type: "STRING",
      required: false
    },
    {
      name: "bots",
      description: "Only delete messages from bots",
      type: "BOOLEAN",
      required: false
    },
    {
      name: "pinned",
      description: "Whether to include pinned messages",
      type: "BOOLEAN",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Check if we have a guild and channel
    const guild = interaction instanceof Message ? interaction.guild : interaction.guild;
    const channel = interaction instanceof Message ? interaction.channel : interaction.channel;
    
    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        ephemeral: true
      });
    }
    
    if (!channel || !(channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)) {
      return interaction.reply({
        content: "❌ This command can only be used in text channels.",
        ephemeral: true
      });
    }
    
    const textChannel = channel as GuildTextBasedChannel;
    
    // Check if the bot has permission to manage messages
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: "❌ I don't have permission to manage messages in this server.",
        ephemeral: true
      });
    }
    
    // Check if the user has permission to manage messages
    const member = interaction instanceof Message 
      ? interaction.member 
      : interaction.member;
    
    if (!member || !('permissions' in member) || !member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: "❌ You don't have permission to manage messages in this server.",
        ephemeral: true
      });
    }
    
    let amount = 0;
    let targetUser: User | null = null;
    let filterText = "";
    let botsOnly = false;
    let includePinned = false;
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const amountOption = interaction.options.getInteger("amount");
      const userOption = interaction.options.getUser("user");
      const containsOption = interaction.options.getString("contains");
      const botsOption = interaction.options.getBoolean("bots");
      const pinnedOption = interaction.options.getBoolean("pinned");
      
      if (amountOption !== null) {
        amount = amountOption;
      }
      
      if (userOption) {
        targetUser = userOption;
      }
      
      if (containsOption) {
        filterText = containsOption;
      }
      
      if (botsOption !== null) {
        botsOnly = botsOption;
      }
      
      if (pinnedOption !== null) {
        includePinned = pinnedOption;
      }
    } else {
      // Handle message command
      if (!args || args.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Invalid Command Usage")
              .setDescription("You must specify how many messages to delete.")
              .addFields(
                { name: "Usage", value: `${config.prefix}clean <amount> [options]` },
                { 
                  name: "Options", 
                  value: [
                    "`--user=<@mention or ID>` - Only delete messages from this user",
                    "`--contains=<text>` - Only delete messages containing this text",
                    "`--bots` - Only delete messages from bots",
                    "`--pinned` - Include pinned messages (normally excluded)"
                  ].join("\n")
                },
                { 
                  name: "Example", 
                  value: `${config.prefix}clean 10 --user=@Someone --contains=spam`
                }
              )
              .setColor(0xFF0000)
          ]
        });
      }
      
      // Parse amount
      try {
        amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) {
          return interaction.reply("❌ Amount must be a positive number.");
        }
      } catch (error) {
        return interaction.reply("❌ Invalid amount specified. Please provide a number between 1 and 100.");
      }
      
      // Parse options
      if (args.length > 1) {
        for (let i = 1; i < args.length; i++) {
          const arg = args[i];
          
          if (arg.startsWith("--user=")) {
            const userArg = arg.slice(7);
            
            // Check if it's a mention
            const mentionMatch = userArg.match(/^<@!?(\d+)>$/);
            let userId: string | null = null;
            
            if (mentionMatch) {
              userId = mentionMatch[1];
            } 
            // Check if it's a raw ID
            else if (/^\d+$/.test(userArg)) {
              userId = userArg;
            }
            
            if (userId) {
              try {
                targetUser = await interaction.client.users.fetch(userId);
              } catch (error) {
                return interaction.reply(`❌ Could not find a user with ID \`${userId}\`.`);
              }
            }
          } else if (arg.startsWith("--contains=")) {
            filterText = arg.slice(11);
          } else if (arg === "--bots") {
            botsOnly = true;
          } else if (arg === "--pinned") {
            includePinned = true;
          }
        }
      }
    }
    
    // Validate amount
    if (amount < 1 || amount > 100) {
      return interaction.reply("❌ Amount must be between 1 and 100.");
    }
    
    try {
      // Acknowledge the command to prevent timeout
      if (interaction instanceof CommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
      } else {
        // For message commands, we'll delete the command message at the end
      }
      
      // Fetch messages
      let messages: Collection<string, Message>;
      
      // We need to fetch one more message than requested to account for the command message
      const fetchAmount = interaction instanceof Message ? amount + 1 : amount;
      
      // Fetch messages from the channel
      try {
        messages = await textChannel.messages.fetch({ limit: fetchAmount });
      } catch (error) {
        console.error("Error fetching messages:", error);
        
        if (interaction instanceof CommandInteraction) {
          return interaction.editReply("❌ Failed to fetch messages. Please try again later.");
        } else {
          return interaction.reply("❌ Failed to fetch messages. Please try again later.");
        }
      }
      
      // If it's a message command, filter out the command message
      if (interaction instanceof Message) {
        messages = messages.filter(msg => msg.id !== interaction.id);
      }
      
      // Apply filters
      let filteredMessages = messages;
      let filterDescription = "";
      
      // Filter by user
      if (targetUser) {
        filteredMessages = filteredMessages.filter(msg => msg.author.id === targetUser?.id);
        filterDescription += `from user ${targetUser.tag} `;
      }
      
      // Filter by text content
      if (filterText) {
        filteredMessages = filteredMessages.filter(msg => 
          msg.content && msg.content.toLowerCase().includes(filterText.toLowerCase())
        );
        filterDescription += `containing "${filterText}" `;
      }
      
      // Filter by bot
      if (botsOnly) {
        filteredMessages = filteredMessages.filter(msg => msg.author.bot);
        filterDescription += `from bots `;
      }
      
      // Filter out pinned messages
      if (!includePinned) {
        filteredMessages = filteredMessages.filter(msg => !msg.pinned);
      }
      
      // Check if we have any messages to delete
      if (filteredMessages.size === 0) {
        if (interaction instanceof CommandInteraction) {
          return interaction.editReply("❌ No messages found matching the filters.");
        } else {
          return interaction.reply("❌ No messages found matching the filters.");
        }
      }
      
      // Delete messages
      try {
        // Get only messages less than 14 days old (Discord limitation)
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const messagesToDelete = filteredMessages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
        const oldMessages = filteredMessages.size - messagesToDelete.size;
        
        if (messagesToDelete.size === 0) {
          if (interaction instanceof CommandInteraction) {
            return interaction.editReply("❌ All matching messages are older than 14 days and cannot be bulk deleted.");
          } else {
            return interaction.reply("❌ All matching messages are older than 14 days and cannot be bulk deleted.");
          }
        }
        
        // First, bulk delete recent messages if any
        if (messagesToDelete.size > 1) {
          await textChannel.bulkDelete(messagesToDelete, true);
        } 
        // If there's only one message or bulk delete fails, delete individually
        else if (messagesToDelete.size === 1) {
          const message = messagesToDelete.first();
          if (message) {
            await message.delete();
          }
        }
        
        // Build response message
        const responseEmbed = new EmbedBuilder()
          .setTitle("🧹 Messages Deleted")
          .setColor(0x2ECC71)
          .setDescription(`Successfully deleted ${messagesToDelete.size} message${messagesToDelete.size !== 1 ? 's' : ''}.`)
          .setTimestamp();
        
        // Add filter information if any
        if (filterDescription) {
          responseEmbed.addFields({ name: "Filters", value: `Deleted messages ${filterDescription.trim()}` });
        }
        
        // Add note about old messages
        if (oldMessages > 0) {
          responseEmbed.addFields({ 
            name: "⚠️ Note", 
            value: `${oldMessages} message${oldMessages !== 1 ? 's' : ''} could not be deleted because ${oldMessages !== 1 ? 'they are' : 'it is'} older than 14 days.`
          });
        }
        
        // Send response
        if (interaction instanceof CommandInteraction) {
          return interaction.editReply({ embeds: [responseEmbed] });
        } else {
          // For message commands, send a temporary response and then delete it
          const response = await interaction.channel.send({ embeds: [responseEmbed] });
          
          // Delete the response after 5 seconds
          setTimeout(() => {
            response.delete().catch(() => {});
          }, 5000);
          
          return;
        }
      } catch (error) {
        console.error("Error deleting messages:", error);
        
        if (interaction instanceof CommandInteraction) {
          return interaction.editReply(`❌ Failed to delete messages: ${error}`);
        } else {
          return interaction.reply(`❌ Failed to delete messages: ${error}`);
        }
      }
    } catch (error) {
      console.error("Error in clean command:", error);
      
      if (interaction instanceof CommandInteraction) {
        return interaction.editReply("❌ An error occurred while processing your command.");
      } else {
        return interaction.reply("❌ An error occurred while processing your command.");
      }
    }
  }
} as DiscordCommand;