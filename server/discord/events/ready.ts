
import { Client, Events, ActivityType } from "discord.js";
import { storage } from "../../storage";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    try {
      if (!client.user) {
        console.error("[READY] Client user not available");
        return;
      }
      
      console.log(`[READY] Logged in as ${client.user.tag}`);
      
      // Set initial presence
      await client.user.setPresence({
        activities: [{ 
          type: ActivityType.Playing,
          name: "Starting up..."
        }],
        status: "online"
      });
      
      // Setup status rotation
      const statuses = [
        { 
          type: ActivityType.Streaming, 
          name: "https://kick.com/itsjustebra", 
          url: "https://kick.com/itsjustebra" 
        },
        { 
          type: ActivityType.Listening, 
          name: "Lifeless rose" 
        },
        { 
          type: ActivityType.Competing, 
          name: "FIFA" 
        },
        { 
          type: ActivityType.Playing, 
          name: `with commands | l?help` 
        }
      ];
      
      let currentStatusIndex = 0;
      
      function updateStatus() {
        const currentStatus = statuses[currentStatusIndex];
        client.user?.setPresence({
          activities: [currentStatus],
          status: "online"
        });
        currentStatusIndex = (currentStatusIndex + 1) % statuses.length;
      }
      
      // Initial status update
      updateStatus();
      // Rotate status every 3 minutes
      setInterval(updateStatus, 180000);

      // Update server stats
      const commandCount = client.commands?.size || 0;
      const prefixCommandCount = commandCount;
      const slashCommandCount = 0;
      const activeServers = client.guilds.cache.size;

      await storage.updateServerStats({
        totalCommands: commandCount,
        slashCommands: slashCommandCount,
        prefixCommands: prefixCommandCount,
        activeServers: activeServers
      });
      
      console.log(`[READY] Bot is serving ${activeServers} servers with ${commandCount} commands`);
    } catch (error) {
      console.error("[READY ERROR]", error);
    }
  }
};
