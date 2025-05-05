import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  User,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "avatar",
  description: "Display a user's avatar",
  category: "utility",
  aliases: ["av", "pfp", "icon"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "user",
      description: "The user whose avatar to show (defaults to yourself)",
      type: "USER",
      required: false
    },
    {
      name: "size",
      description: "The size of the avatar (16-4096)",
      type: "INTEGER",
      required: false,
      choices: [
        { name: "Small (128px)", value: 128 },
        { name: "Medium (256px)", value: 256 },
        { name: "Large (512px)", value: 512 },
        { name: "Extra Large (1024px)", value: 1024 },
        { name: "Maximum (4096px)", value: 4096 }
      ]
    },
    {
      name: "format",
      description: "The format of the avatar",
      type: "STRING",
      required: false,
      choices: [
        { name: "PNG", value: "png" },
        { name: "JPG", value: "jpg" },
        { name: "WebP", value: "webp" },
        { name: "GIF (if animated)", value: "gif" }
      ]
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    let targetUser: User | null = null;
    let size = 256;
    let format = "png";
    
    if (interaction instanceof CommandInteraction) {
      // Handle slash command
      const userOption = interaction.options.getUser("user");
      const sizeOption = interaction.options.getInteger("size");
      const formatOption = interaction.options.getString("format");
      
      targetUser = userOption || interaction.user;
      if (sizeOption) size = sizeOption;
      if (formatOption) format = formatOption;
    } else {
      // Handle message command
      targetUser = interaction.author;
      
      // Check if arguments are provided
      if (args && args.length > 0) {
        // Check for user mention or ID
        const userArg = args[0];
        
        // Check if it's a mention
        const mentionMatch = userArg.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
          const userId = mentionMatch[1];
          try {
            targetUser = await interaction.client.users.fetch(userId);
          } catch (error) {
            return interaction.reply(`❌ Could not find a user with ID \`${userId}\`.`);
          }
        } 
        // Check if it's a raw ID
        else if (/^\d+$/.test(userArg)) {
          try {
            targetUser = await interaction.client.users.fetch(userArg);
          } catch (error) {
            return interaction.reply(`❌ Could not find a user with ID \`${userArg}\`.`);
          }
        }
        
        // Parse size and format options
        for (let i = 1; i < args.length; i++) {
          const arg = args[i].toLowerCase();
          
          // Parse size
          if (arg.startsWith("--size=")) {
            const sizeValue = parseInt(arg.slice(7));
            if (!isNaN(sizeValue) && sizeValue >= 16 && sizeValue <= 4096) {
              size = sizeValue;
            } else {
              return interaction.reply("❌ Size must be between 16 and 4096 pixels.");
            }
          }
          
          // Parse format
          else if (arg.startsWith("--format=")) {
            const formatValue = arg.slice(9).toLowerCase();
            if (["png", "jpg", "jpeg", "webp", "gif"].includes(formatValue)) {
              format = formatValue === "jpeg" ? "jpg" : formatValue;
            } else {
              return interaction.reply("❌ Format must be one of: png, jpg, webp, gif.");
            }
          }
        }
      }
    }
    
    if (!targetUser) {
      return interaction.reply("❌ Could not find the specified user.");
    }
    
    try {
      // Get the avatar URLs
      const avatarURL = targetUser.displayAvatarURL({ 
        size: size, 
        extension: format === "gif" ? undefined : format as any,
        forceStatic: format !== "gif"
      });
      
      // Check if the user has an animated avatar
      const isAnimated = targetUser.avatar?.startsWith("a_");
      
      // Handle GIF option for non-animated avatars
      if (format === "gif" && !isAnimated) {
        return interaction.reply({
          content: "⚠️ This user doesn't have an animated avatar. Please choose a different format.",
          ephemeral: true
        });
      }
      
      // Create embed for the avatar
      const embed = new EmbedBuilder()
        .setTitle(`${targetUser.username}'s Avatar`)
        .setColor(0x3498DB)
        .setImage(avatarURL)
        .setDescription(`Avatar for **${targetUser.tag}**`)
        .addFields(
          { name: "Size", value: `${size}x${size} pixels`, inline: true },
          { name: "Format", value: format.toUpperCase(), inline: true }
        )
        .setFooter({
          text: `User ID: ${targetUser.id} • Requested by ${interaction instanceof CommandInteraction ? interaction.user.tag : interaction.author.tag}`
        })
        .setTimestamp();
      
      // Create buttons for different formats
      const buttons: ButtonBuilder[] = [];
      
      // Only add PNG button if not already PNG
      if (format !== "png") {
        buttons.push(
          new ButtonBuilder()
            .setLabel("PNG")
            .setStyle(ButtonStyle.Link)
            .setURL(targetUser.displayAvatarURL({ 
              size: size, 
              extension: "png",
              forceStatic: true
            }))
        );
      }
      
      // Only add JPG button if not already JPG
      if (format !== "jpg") {
        buttons.push(
          new ButtonBuilder()
            .setLabel("JPG")
            .setStyle(ButtonStyle.Link)
            .setURL(targetUser.displayAvatarURL({ 
              size: size, 
              extension: "jpg",
              forceStatic: true
            }))
        );
      }
      
      // Only add WebP button if not already WebP
      if (format !== "webp") {
        buttons.push(
          new ButtonBuilder()
            .setLabel("WebP")
            .setStyle(ButtonStyle.Link)
            .setURL(targetUser.displayAvatarURL({ 
              size: size, 
              extension: "webp",
              forceStatic: true
            }))
        );
      }
      
      // Add GIF button if the avatar is animated and not already GIF
      if (isAnimated && format !== "gif") {
        buttons.push(
          new ButtonBuilder()
            .setLabel("GIF")
            .setStyle(ButtonStyle.Link)
            .setURL(targetUser.displayAvatarURL({ 
              size: size, 
              extension: undefined,
              forceStatic: false
            }))
        );
      }
      
      // Add a button to open the avatar in browser (original quality)
      buttons.push(
        new ButtonBuilder()
          .setLabel("Open Original")
          .setStyle(ButtonStyle.Link)
          .setURL(avatarURL)
      );
      
      // Add buttons to the embed if there are any
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
      
      // Determine if we should include the button row (only if there are more than one button)
      const components = buttons.length > 1 ? [row] : [];
      
      // Send the response
      return interaction.reply({ 
        embeds: [embed],
        components: components
      });
    } catch (error) {
      console.error("Error fetching avatar:", error);
      return interaction.reply({
        content: "❌ An error occurred while fetching the avatar.",
        ephemeral: true
      });
    }
  }
} as DiscordCommand;