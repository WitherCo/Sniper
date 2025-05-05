import { CommandInteraction, Message, ApplicationCommandOptionType } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "help",
  description: "Show help information about available commands",
  category: "utility",
  aliases: ["commands", "h", "cmds"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    const botConfig = await storage.getBotConfig();
    const prefix = botConfig?.prefix || "l?";
    
    if (interaction instanceof CommandInteraction) {
      return interaction.reply({
        embeds: [{
          title: "Prefix-Only Mode",
          description: `This bot is running in prefix-only mode. Please use prefix commands with \`${prefix}\` instead.`,
          color: 0x5865F2,
          footer: { text: `Example: ${prefix}help` }
        }]
      });
    }

    const args = interaction.content.split(" ").slice(1);
    const input = args[0];
    
    if (!input) {
      try {
        const categories = await storage.getAllCategories();
        
        if (!categories.length) {
          return interaction.reply("No command categories found");
        }
        
        // Filter out extra commands when counting
        const categoryFields = await Promise.all(categories.map(async cat => {
          const commands = await storage.getCommandsByCategory(cat.name);
          const filteredCommands = commands.filter(cmd => !cmd.name.toLowerCase().includes('extra'));
          return {
            name: `${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)} (${filteredCommands.length})`,
            value: cat.description || `${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)} commands`,
            inline: true
          };
        }));
        
        return interaction.reply({
          embeds: [{
            title: "Bot Help",
            description: `Here are the available command categories. Use \`${prefix}help [command]\` for info about a specific command or \`${prefix}help [category]\` to see all commands in a category.`,
            fields: categoryFields,
            color: 0x5865F2,
            footer: { text: `Prefix: ${prefix}` }
          }]
        });
      } catch (error) {
        console.error("Error fetching categories:", error);
        return interaction.reply("An error occurred while fetching help information");
      }
    }
    
    try {
      const command = await storage.getCommandByName(input.toLowerCase());
      
      // Don't show help for extra commands
      if (command && !command.name.toLowerCase().includes('extra')) {
        return interaction.reply({
          embeds: [{
            title: `Help: ${command.name}`,
            description: command.description,
            fields: [
              { name: "Category", value: command.category, inline: true },
              { name: "Cooldown", value: `${command.cooldown} seconds`, inline: true },
              { name: "Permissions", value: command.permissions?.length ? command.permissions.join(", ") : "None", inline: true },
              { name: "Usage", value: command.usage?.replace("/", prefix) || `${prefix}${command.name}`, inline: false },
              { name: "Example", value: command.example?.replace("/", prefix) || `${prefix}${command.name}`, inline: false },
              { name: "Available as", value: "Prefix Command", inline: false }
            ],
            color: 0x5865F2,
            footer: { text: "[] = optional parameter, <> = required parameter" }
          }]
        });
      }
      
      const categories = await storage.getAllCategories();
      const category = categories.find(c => c.name.toLowerCase() === input.toLowerCase());
      
      if (category) {
        const commands = await storage.getCommandsByCategory(category.name.toLowerCase());
        
        // Filter out extra commands
        const filteredCommands = commands.filter(cmd => !cmd.name.toLowerCase().includes('extra'));
        
        if (!filteredCommands.length) {
          return interaction.reply(`No commands found in category "${category.name}"`);
        }
        
        filteredCommands.sort((a, b) => a.name.localeCompare(b.name));
        const commandList = filteredCommands.map(cmd => `**${prefix}${cmd.name}** - ${cmd.description}`).join("\n");
        
        return interaction.reply({
          embeds: [{
            title: `${category.name.charAt(0).toUpperCase() + category.name.slice(1)} Commands`,
            description: `Here are all commands in the ${category.name} category:\n\n${commandList}`,
            color: 0x5865F2,
            footer: { text: `Use "${prefix}help [command]" for detailed information about a specific command` }
          }]
        });
      }
      
      return interaction.reply(`No command or category found with name "${input}"`);
      
    } catch (error) {
      console.error("Error in help command:", error);
      return interaction.reply("An error occurred while fetching help information");
    }
  }
} as DiscordCommand;
