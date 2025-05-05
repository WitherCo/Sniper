import { Events, Interaction, ChatInputCommandInteraction } from "discord.js";
import { checkPermissions } from "../utils/permissions";
import { handleCooldown } from "../utils/cooldown";
import { storage } from "../../storage";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    try {
      if (!interaction.isChatInputCommand()) return;

      const commandName = interaction.commandName;
      const command = interaction.client.commands.get(commandName);

      if (!command) {
        return interaction.reply({content: "Command not found", ephemeral: true});
      }

      // Check if user is bot banned
      const botBan = await storage.getBotBan(interaction.user.id);
      if (botBan) {
        return interaction.reply({ content: `❌ You are banned from using bot commands.\nReason: ${botBan.reason}`, ephemeral: true });
      }

      // Check if user is blacklisted
      const blacklist = await storage.getBlacklist() || [];
      if (blacklist.includes(interaction.user.id)) {
        return interaction.reply({ content: "❌ You are blacklisted from using bot commands.", ephemeral: true });
      }

      // Check cooldown
      const cooldownResult = handleCooldown(interaction.user.id, command);
      if (cooldownResult.onCooldown) {
        return interaction.reply({ content: `⏰ Please wait ${cooldownResult.timeLeft.toFixed(1)} seconds before using this command again.`, ephemeral: true });
      }

      await command.execute(interaction);
    } catch (error) {
      console.error(`[ERROR] Error in interactionCreate event:`, error);
      if (interaction.isRepliable()) {
        await interaction.reply({ content: "❌ An error occurred while executing the command.", ephemeral: true });
      }
    }
  }
};