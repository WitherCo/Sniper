import { Client } from "discord.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

// Get the directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EventHandler {
  private static eventsDir = path.join(__dirname, "../events");

  /**
   * Register all events
   */
  static async registerEvents(client: Client): Promise<void> {
    try {
      // Get all event files
      const eventFiles = fs.readdirSync(this.eventsDir).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
      console.log(`[DEBUG] Found ${eventFiles.length} event files: ${eventFiles.join(', ')}`);
      
      // Load each event
      for (const file of eventFiles) {
        const filePath = path.join(this.eventsDir, file);
        console.log(`[DEBUG] Loading event from: ${filePath}`);
        
        try {
          // Use dynamic import for ES modules
          const eventModule = await import(filePath);
          
          if (!eventModule || !eventModule.default) {
            console.warn(`[WARNING] Event file ${file} does not have a default export`);
            continue;
          }
          
          const event = eventModule.default;
          console.log(`[DEBUG] Registering event: ${event.name}, once: ${!!event.once}`);
          
          if (event.once) {
            client.once(event.name, (...args) => {
              console.log(`[DEBUG] Executing once event: ${event.name}`);
              try {
                event.execute(...args);
              } catch (error) {
                console.error(`[ERROR] Failed to execute once event ${event.name}:`, error);
              }
            });
          } else {
            client.on(event.name, (...args) => {
              console.log(`[DEBUG] Executing event: ${event.name}`);
              try {
                event.execute(...args);
              } catch (error) {
                console.error(`[ERROR] Failed to execute event ${event.name}:`, error);
              }
            });
          }
          
          console.log(`[DEBUG] Successfully registered event: ${event.name}`);
        } catch (error) {
          console.error(`[ERROR] Failed to load event file ${file}:`, error);
        }
      }
      
      console.log(`Loaded ${eventFiles.length} events`);
    } catch (error) {
      console.error("[ERROR] Error registering events:", error);
      throw error;
    }
  }
}
