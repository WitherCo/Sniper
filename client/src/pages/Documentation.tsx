import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Documentation() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Documentation</h2>
          <p className="text-[#B9BBBE]">Learn how to use and extend your Discord bot</p>
        </div>
      </div>

      <Tabs defaultValue="getting-started">
        <TabsList className="bg-[#36393F] border border-gray-700 mb-6">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started">
          <Card className="bg-[#36393F] border-gray-700">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription className="text-[#B9BBBE]">
                Everything you need to know to get your Discord bot up and running
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Installation</h3>
                <p className="text-[#B9BBBE] mb-2">
                  First, make sure you have Node.js v16.9.0 or higher installed.
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">npm install</pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                <p className="text-[#B9BBBE] mb-2">
                  Create a .env file in the root directory with the following variables:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">
{`DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=optional_development_guild_id`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Running the Bot</h3>
                <p className="text-[#B9BBBE] mb-2">
                  Start the bot in development mode:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">npm run dev</pre>
                </div>
                
                <p className="text-[#B9BBBE] mt-2 mb-2">
                  For production:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">npm run build
npm start</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands">
          <Card className="bg-[#36393F] border-gray-700">
            <CardHeader>
              <CardTitle>Creating Commands</CardTitle>
              <CardDescription className="text-[#B9BBBE]">
                Learn how to create and register commands for your Discord bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Command Structure</h3>
                <p className="text-[#B9BBBE] mb-2">
                  Each command is a separate file that exports a command object:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">
{`import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

const command: DiscordCommand = {
  name: "ping",
  description: "Replies with Pong!",
  category: "utility",
  aliases: ["latency"],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: [],
  
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply("Pong!");
    } else {
      await interaction.reply("Pong!");
    }
  }
};

export default command;`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Command Options</h3>
                <p className="text-[#B9BBBE] mb-2">
                  For commands that need user input, define options:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">
{`options: [
  {
    name: "user",
    description: "The user to target",
    type: "USER",
    required: true
  },
  {
    name: "reason",
    description: "The reason for the action",
    type: "STRING",
    required: false
  }
]`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Deploying Slash Commands</h3>
                <p className="text-[#B9BBBE] mb-2">
                  After creating slash commands, you need to deploy them to Discord:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">
{`// Run this script to deploy commands
node deploy-commands.js

// Or use the built-in deployment function
await deployCommands();`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="bg-[#36393F] border-gray-700">
            <CardHeader>
              <CardTitle>Event Handling</CardTitle>
              <CardDescription className="text-[#B9BBBE]">
                Understanding and creating event listeners for your Discord bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Event Structure</h3>
                <p className="text-[#B9BBBE] mb-2">
                  Events are triggered by Discord and handled by your bot:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">
{`import { Events, Client } from "discord.js";

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(\`Ready! Logged in as \${client.user?.tag}\`);
  }
};`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Common Events</h3>
                <ul className="list-disc pl-5 space-y-1 text-[#B9BBBE]">
                  <li><strong className="text-white">ClientReady</strong> - Fired when the bot is ready</li>
                  <li><strong className="text-white">InteractionCreate</strong> - Fired when a slash command or UI interaction is used</li>
                  <li><strong className="text-white">MessageCreate</strong> - Fired when a message is sent</li>
                  <li><strong className="text-white">GuildMemberAdd</strong> - Fired when a member joins a server</li>
                  <li><strong className="text-white">GuildMemberRemove</strong> - Fired when a member leaves a server</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Creating Custom Events</h3>
                <p className="text-[#B9BBBE] mb-2">
                  You can create custom events for your bot:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">
{`// Emit a custom event
client.emit('customEvent', ...args);

// Listen for a custom event
client.on('customEvent', (...args) => {
  // Handle the event
});`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment">
          <Card className="bg-[#36393F] border-gray-700">
            <CardHeader>
              <CardTitle>Deployment Guide</CardTitle>
              <CardDescription className="text-[#B9BBBE]">
                How to deploy your Discord bot to a production environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Preparing for Deployment</h3>
                <p className="text-[#B9BBBE]">
                  Before deploying, make sure you've:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#B9BBBE]">
                  <li>Set up all environment variables</li>
                  <li>Built the production version of your bot</li>
                  <li>Tested thoroughly in a development environment</li>
                  <li>Deployed slash commands to Discord's API</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Hosting Options</h3>
                <p className="text-[#B9BBBE]">
                  Some popular hosting options for Discord bots:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#B9BBBE]">
                  <li><strong className="text-white">Railway</strong> - Easy deployments with GitHub integration</li>
                  <li><strong className="text-white">Heroku</strong> - Free tier available with some limitations</li>
                  <li><strong className="text-white">Digital Ocean</strong> - More control with droplets or App Platform</li>
                  <li><strong className="text-white">AWS/GCP</strong> - Full cloud infrastructure for scalable bots</li>
                  <li><strong className="text-white">VPS</strong> - Maximum control with your own virtual private server</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">PM2 for Process Management</h3>
                <p className="text-[#B9BBBE] mb-2">
                  Use PM2 to keep your bot running and restart on crashes:
                </p>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
                  <pre className="text-[#B9BBBE]">
{`# Install PM2
npm install -g pm2

# Start your bot with PM2
pm2 start npm --name "discord-bot" -- start

# Set up auto-restart
pm2 startup
pm2 save`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
