import { 
  CommandInteraction, 
  Message, 
  EmbedBuilder,
  Collection,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { config } from "../../config";

export default {
  name: "help",
  description: "Get help with commands",
  category: "information",
  aliases: ["commands", "cmds", "h"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  options: [
    {
      name: "command",
      description: "Get help for a specific command",
      type: "STRING",
      required: false
    },
    {
      name: "category",
      description: "Get help for a specific category",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    // Initialize client, commands, and prefix
    const client = interaction.client;
    const commands = client.commands;
    const slashCommands = client.slashCommands;
    const prefix = config.prefix;
    
    // If user provided a command name, show help for that specific command
    if (interaction instanceof CommandInteraction) {
      const commandArg = interaction.options.getString("command");
      const categoryArg = interaction.options.getString("category");
      
      if (commandArg) {
        return showCommandHelp(interaction, commands, slashCommands, commandArg, prefix);
      } else if (categoryArg) {
        return showCategoryHelp(interaction, commands, categoryArg, prefix);
      } else {
        return showMainHelp(interaction, commands, prefix);
      }
    } else {
      // Handle message command
      if (!args || args.length === 0) {
        return showMainHelp(interaction, commands, prefix);
      } else if (args.length === 1) {
        const arg = args[0].toLowerCase();
        
        // Check if it's a category
        const categories = getCategories(commands);
        if (categories.has(arg)) {
          return showCategoryHelp(interaction, commands, arg, prefix);
        }
        
        // If not a category, assume it's a command
        return showCommandHelp(interaction, commands, slashCommands, arg, prefix);
      } else {
        // More than one argument - show an error
        return interaction.reply(
          `❌ Too many arguments. Use \`${prefix}help [command]\` or \`${prefix}help [category]\` for more information.`
        );
      }
    }
  }
} as DiscordCommand;

/**
 * Get all command categories
 */
function getCategories(commands: Collection<string, DiscordCommand>): Set<string> {
  const categories = new Set<string>();
  
  for (const command of commands.values()) {
    if (command.category) {
      categories.add(command.category.toLowerCase());
    }
  }
  
  return categories;
}

/**
 * Show the main help menu
 */
async function showMainHelp(
  interaction: CommandInteraction | Message, 
  commands: Collection<string, DiscordCommand>,
  prefix: string
): Promise<any> {
  // Group commands by category
  const categoryMap = new Map<string, DiscordCommand[]>();
  
  for (const command of commands.values()) {
    if (!command.category) continue;
    
    const category = command.category.toLowerCase();
    const categoryCommands = categoryMap.get(category) || [];
    categoryCommands.push(command);
    categoryMap.set(category, categoryCommands);
  }
  
  // Create the main embed
  const mainEmbed = new EmbedBuilder()
    .setTitle("Command Help")
    .setColor(0x3498DB)
    .setDescription(
      `Use \`${prefix}help [command]\` for more information about a specific command.\n` +
      `Use \`${prefix}help [category]\` to see all commands in a category.\n\n` +
      `**Available Categories:**`
    )
    .setFooter({ 
      text: `Bot created by Lifeless rose • Use ${prefix}about for more info` 
    });
  
  // Create all category embeds and add categories to main embed
  const embeds: EmbedBuilder[] = [mainEmbed];
  
  for (const [category, categoryCommands] of categoryMap.entries()) {
    // Create a category embed
    const categoryEmbed = createCategoryEmbed(category, categoryCommands, prefix);
    embeds.push(categoryEmbed);
    
    // Add the category to the main embed
    const capitalizedCategory = capitalize(category);
    mainEmbed.addFields({
      name: capitalizedCategory,
      value: `${categoryCommands.length} commands available`,
      inline: true
    });
  }
  
  // If it's a slash command or we can use components, use a select menu
  if (interaction instanceof CommandInteraction || "createMessageComponentCollector" in interaction.channel!) {
    // Create select menu for categories
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("category-select")
      .setPlaceholder("Select a category")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Main Menu")
          .setDescription("Return to main help menu")
          .setValue("main"),
        ...Array.from(categoryMap.keys()).map(category => 
          new StringSelectMenuOptionBuilder()
            .setLabel(capitalize(category))
            .setDescription(`View ${capitalize(category)} commands`)
            .setValue(category)
        )
      );
    
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    
    // Create navigation buttons
    const buttonRow = createHelpButtons();
    
    // Send the initial embed with components
    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [selectRow, buttonRow]
    });
    
    // Create a component collector for interactions
    const filter = (i: any) => {
      const correctUser = interaction instanceof CommandInteraction
        ? i.user.id === interaction.user.id
        : i.user.id === interaction.author.id;
      
      return correctUser && (i.customId === "category-select" || 
                           i.customId === "help-prev" || 
                           i.customId === "help-next");
    };
    
    const collector = response.createMessageComponentCollector({
      filter,
      time: 300000, // 5 minutes
    });
    
    let currentPage = 0;
    
    collector.on("collect", async (i) => {
      // Handle select menu interaction
      if (i.customId === "category-select" && i.isStringSelectMenu()) {
        const selectedValue = i.values[0];
        
        if (selectedValue === "main") {
          currentPage = 0;
          await i.update({
            embeds: [mainEmbed],
            components: [selectRow, buttonRow]
          });
        } else {
          // Find the category index
          const categoryIndex = Array.from(categoryMap.keys()).findIndex(c => c === selectedValue);
          if (categoryIndex !== -1) {
            currentPage = categoryIndex + 1; // +1 because main embed is at index 0
            await i.update({
              embeds: [embeds[currentPage]],
              components: [selectRow, buttonRow]
            });
          }
        }
      }
      // Handle button interactions
      else if (i.isButton()) {
        if (i.customId === "help-prev") {
          currentPage = (currentPage - 1 + embeds.length) % embeds.length;
        } else if (i.customId === "help-next") {
          currentPage = (currentPage + 1) % embeds.length;
        }
        
        await i.update({
          embeds: [embeds[currentPage]],
          components: [selectRow, buttonRow]
        });
      }
    });
    
    collector.on("end", async () => {
      // Update the message to remove components once the collector ends
      if (interaction instanceof CommandInteraction) {
        await interaction.editReply({
          embeds: [embeds[currentPage]],
          components: []
        }).catch(() => {});
      } else {
        // For message commands, try to edit the original response
        try {
          const msg = await response.fetch();
          await msg.edit({
            embeds: [embeds[currentPage]],
            components: []
          }).catch(() => {});
        } catch (error) {
          // If we can't edit it, don't do anything
        }
      }
    });
    
    return response;
  } else {
    // If we can't use components, just send the main embed
    return interaction.reply({ embeds: [mainEmbed] });
  }
}

/**
 * Create help embed for a specific category
 */
function createCategoryEmbed(
  category: string, 
  commands: DiscordCommand[], 
  prefix: string
): EmbedBuilder {
  const capitalizedCategory = capitalize(category);
  
  const embed = new EmbedBuilder()
    .setTitle(`${capitalizedCategory} Commands`)
    .setColor(getCategoryColor(category))
    .setDescription(`Here are all the commands in the ${capitalizedCategory} category:`);
  
  // Sort commands alphabetically
  commands.sort((a, b) => a.name.localeCompare(b.name));
  
  // Add each command to the embed
  for (const command of commands) {
    let commandSyntax = `\`${prefix}${command.name}\``;
    
    // Add aliases if any
    if (command.aliases && command.aliases.length > 0) {
      commandSyntax += ` (aliases: ${command.aliases.map(a => `\`${a}\``).join(", ")})`;
    }
    
    embed.addFields({
      name: commandSyntax,
      value: command.description || "No description available"
    });
  }
  
  // Add footer with navigation hint
  embed.setFooter({
    text: `Use ${prefix}help [command] for more detailed information about a command`
  });
  
  return embed;
}

/**
 * Show help for a specific category
 */
async function showCategoryHelp(
  interaction: CommandInteraction | Message,
  commands: Collection<string, DiscordCommand>,
  category: string,
  prefix: string
): Promise<any> {
  const categoryCommands = Array.from(commands.values()).filter(
    cmd => cmd.category && cmd.category.toLowerCase() === category.toLowerCase()
  );
  
  if (categoryCommands.length === 0) {
    return interaction.reply({
      content: `❌ No commands found in the "${category}" category.`,
      ephemeral: true
    });
  }
  
  const embed = createCategoryEmbed(category, categoryCommands, prefix);
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Show help for a specific command
 */
async function showCommandHelp(
  interaction: CommandInteraction | Message,
  commands: Collection<string, DiscordCommand>,
  slashCommands: Collection<string, DiscordCommand>,
  commandName: string,
  prefix: string
): Promise<any> {
  // First check regular commands
  let command = commands.get(commandName.toLowerCase());
  
  // If not found, check aliases
  if (!command) {
    command = Array.from(commands.values()).find(
      cmd => cmd.aliases && cmd.aliases.map(a => a.toLowerCase()).includes(commandName.toLowerCase())
    );
  }
  
  // If still not found and it's not already a slash command, check slash commands
  if (!command && commandName.charAt(0) !== '/') {
    command = slashCommands.get(commandName.toLowerCase());
    
    // Check aliases in slash commands
    if (!command) {
      command = Array.from(slashCommands.values()).find(
        cmd => cmd.aliases && cmd.aliases.map(a => a.toLowerCase()).includes(commandName.toLowerCase())
      );
    }
  }
  
  // If command not found at all
  if (!command) {
    return interaction.reply({
      content: `❌ Command "${commandName}" not found. Use \`${prefix}help\` to see all available commands.`,
      ephemeral: true
    });
  }
  
  // Format permissions
  const permissionsText = command.permissions && command.permissions.length > 0
    ? command.permissions.join(", ")
    : "None";
  
  // Create embed for the command
  const embed = new EmbedBuilder()
    .setTitle(`Command: ${command.name}`)
    .setColor(command.category ? getCategoryColor(command.category) : 0x3498DB)
    .setDescription(command.description || "No description available")
    .addFields(
      { name: "Category", value: command.category ? capitalize(command.category) : "Uncategorized", inline: true },
      { name: "Cooldown", value: `${command.cooldown || 0} seconds`, inline: true },
      { name: "Required Permissions", value: permissionsText, inline: true }
    );
  
  // Add usage examples if any
  if (command.usage) {
    embed.addFields({
      name: "Usage",
      value: `\`${prefix}${command.name} ${command.usage}\``
    });
  } else {
    embed.addFields({
      name: "Usage",
      value: `\`${prefix}${command.name}\``
    });
  }
  
  // Add aliases if any
  if (command.aliases && command.aliases.length > 0) {
    embed.addFields({
      name: "Aliases",
      value: command.aliases.map(a => `\`${a}\``).join(", ")
    });
  }
  
  // Add available as slash command
  if (command.slash) {
    embed.addFields({
      name: "Slash Command",
      value: `This command is also available as a slash command: \`/${command.name}\``
    });
  }
  
  // Format options if any
  if (command.options && command.options.length > 0) {
    const optionsText = command.options.map(opt => {
      const requiredText = opt.required ? " (required)" : " (optional)";
      return `\`${opt.name}\`: ${opt.description}${requiredText}`;
    }).join("\n");
    
    embed.addFields({
      name: "Options",
      value: optionsText
    });
  }
  
  return interaction.reply({ embeds: [embed] });
}

/**
 * Create navigation buttons for help command
 */
function createHelpButtons(): ActionRowBuilder<ButtonBuilder> {
  const prevButton = new ButtonBuilder()
    .setCustomId("help-prev")
    .setLabel("Previous")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("⬅️");
  
  const nextButton = new ButtonBuilder()
    .setCustomId("help-next")
    .setLabel("Next")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("➡️");
  
  return new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);
}

/**
 * Get a color for a category
 */
function getCategoryColor(category: string): number {
  const colors: Record<string, number> = {
    admin: 0xE74C3C,       // Red
    moderation: 0xE67E22,  // Orange
    utility: 0x3498DB,     // Blue
    information: 0x2ECC71, // Green
    fun: 0x9B59B6,         // Purple
    games: 0xF1C40F,       // Yellow
    music: 0x1ABC9C,       // Turquoise
    economy: 0x95A5A6      // Gray
  };
  
  return colors[category.toLowerCase()] || 0x3498DB;
}

/**
 * Capitalize the first letter of each word in a string
 */
function capitalize(str: string): string {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}