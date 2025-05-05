
import { CommandInteraction, Message, PermissionFlagsBits, TextChannel, CategoryChannel } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "masslock",
  description: "Lock multiple channels at once",
  category: "moderation",
  aliases: ["lockall", "lockmultiple"],
  slash: true,
  prefix: true,
  cooldown: 10,
  permissions: ["ManageChannels"],
  options: [
    {
      name: "category",
      description: "Lock all channels in a category (optional)",
      type: "CHANNEL",
      required: false
    },
    {
      name: "reason",
      description: "Reason for the mass lock",
      type: "STRING",
      required: false
    }
  ],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    try {
      let reason = "No reason provided";
      let category = null;
      
      if (interaction instanceof CommandInteraction) {
        category = interaction.options.getChannel("category");
        reason = interaction.options.getString("reason") || reason;
      }

      const channels = category 
        ? (category as CategoryChannel).children.cache.filter(ch => ch.type === 0)
        : interaction.guild?.channels.cache.filter(ch => ch.type === 0);

      if (!channels || channels.size === 0) {
        return interaction.reply("❌ No channels found to lock.");
      }

      let locked = 0;
      await Promise.all(channels.map(async (channel) => {
        try {
          await (channel as TextChannel).permissionOverwrites.edit(
            interaction.guild!.roles.everyone,
            { SendMessages: false }
          );
          locked++;
        } catch (err) {
          console.error(`Failed to lock ${channel.name}:`, err);
        }
      }));

      const response = `✅ Successfully locked ${locked} channel${locked !== 1 ? 's' : ''}\nReason: ${reason}`;
      
      if (interaction instanceof CommandInteraction) {
        return interaction.reply({ content: response, ephemeral: true });
      } else {
        return interaction.reply(response);
      }
    } catch (error) {
      console.error("[MASSLOCK ERROR]", error);
      return interaction.reply("❌ Failed to execute mass lock command.");
    }
  }
} as DiscordCommand;
