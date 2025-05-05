import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ServerStats, Command, Category } from "@/types";
import StatsCard from "@/components/StatsCard";
import CategoryHeader from "@/components/CategoryHeader";
import CommandCard from "@/components/CommandCard";
import { Button } from "@/components/ui/button";
import { Search, Plus, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: stats } = useQuery<ServerStats>({
    queryKey: ['/api/stats'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: moderationCommands } = useQuery<Command[]>({
    queryKey: ['/api/commands/category/moderation'],
  });

  const { data: utilityCommands } = useQuery<Command[]>({
    queryKey: ['/api/commands/category/utility'],
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Bot Dashboard</h2>
          <p className="text-[#B9BBBE]">Manage your Discord bot with 400+ commands</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button className="py-2 px-4 bg-[#5865F2] hover:bg-opacity-80 transition-colors flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            Add Command
          </Button>
          <Button variant="secondary" className="py-2 px-4 bg-[#42464D] hover:bg-opacity-80 transition-colors flex items-center">
            <RefreshCw className="h-5 w-5 mr-1" />
            Deploy
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Total Commands" 
          value={stats?.totalCommands || 0} 
          changeLabel="+12 this week" 
          percentage={82} 
          color="blue" 
        />
        
        <StatsCard 
          title="Slash Commands" 
          value={stats?.slashCommands || 0} 
          changeLabel="+28 this week" 
          percentage={57} 
          color="green" 
        />
        
        <StatsCard 
          title="Prefix Commands" 
          value={stats?.prefixCommands || 0} 
          changeLabel="+5 this week" 
          percentage={43} 
          color="yellow" 
        />
        
        <StatsCard 
          title="Active Servers" 
          value={stats?.activeServers || 0} 
          changeLabel="+15 this week" 
          changeType="increase" 
          color="purple" 
        />
      </div>

      {/* Command Browser Section */}
      <div className="bg-[#36393F] rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex flex-col md:flex-row justify-between">
          <h3 className="text-lg font-semibold">Command Browser</h3>
          <div className="mt-3 md:mt-0 flex space-x-2">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search commands..."
                className="w-full px-4 py-2 bg-[#2F3136] rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-5 w-5 absolute right-3 top-2.5 text-gray-400" />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="px-3 py-2 bg-[#2F3136] rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(category => (
                  <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="px-3 py-2 bg-[#2F3136] rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="slash">Slash Commands</SelectItem>
                <SelectItem value="prefix">Prefix Commands</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Command List */}
        <div className="p-6">
          {/* Category: Moderation */}
          {moderationCommands && moderationCommands.length > 0 && (
            <div className="mb-8">
              <CategoryHeader 
                category={{ 
                  name: "moderation", 
                  commandCount: moderationCommands.length,
                }} 
                showMore={() => {}} 
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {moderationCommands.slice(0, 3).map(command => (
                  <CommandCard 
                    key={command.id} 
                    command={command} 
                    onEdit={() => {}} 
                    onDelete={() => {}} 
                  />
                ))}
              </div>

              {moderationCommands.length > 3 && (
                <div className="mt-4 text-center">
                  <button className="text-[#5865F2] hover:underline text-sm font-medium flex items-center justify-center mx-auto">
                    Show more moderation commands
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Category: Utility */}
          {utilityCommands && utilityCommands.length > 0 && (
            <div className="mb-8">
              <CategoryHeader 
                category={{ 
                  name: "utility", 
                  commandCount: utilityCommands.length,
                }} 
                showMore={() => {}} 
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {utilityCommands.slice(0, 3).map(command => (
                  <CommandCard 
                    key={command.id} 
                    command={command} 
                    onEdit={() => {}} 
                    onDelete={() => {}} 
                  />
                ))}
              </div>

              {utilityCommands.length > 3 && (
                <div className="mt-4 text-center">
                  <button className="text-[#5865F2] hover:underline text-sm font-medium flex items-center justify-center mx-auto">
                    Show more utility commands
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Developer Section */}
          <div className="mt-10 bg-[#2F3136] rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl font-semibold mb-4">Developer Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Command Handler Architecture</h4>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
<pre className="text-[#B9BBBE]">
{`const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const commandFolders = fs.readdirSync('./commands');
  
  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(\`./commands/\${folder}\`)
      .filter(file => file.endsWith('.js'));
      
    for (const file of commandFiles) {
      const command = require(\`../commands/\${folder}/\${file}\`);
      client.commands.set(command.name, command);
    }
  }
};`}
</pre>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Slash Command Registration</h4>
                <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
<pre className="text-[#B9BBBE]">
{`const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [];
// Collect commands from files...

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );
    console.log('Slash commands registered!');
  } catch (error) {
    console.error(error);
  }
})();`}
</pre>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">Command Template</h4>
              <div className="bg-gray-800 rounded-md p-3 font-mono text-sm overflow-x-auto">
<pre className="text-[#B9BBBE]">
{`module.exports = {
  name: 'command-name',
  description: 'Command description',
  category: 'utility',
  aliases: ['alias1', 'alias2'],
  slash: true,
  prefix: true,
  cooldown: 5,
  permissions: ['ADMINISTRATOR'],
  options: [
    {
      name: 'target',
      description: 'Target user',
      type: 'USER',
      required: true
    }
  ],
  
  execute(interaction, args) {
    // Command logic here
  }
};`}
</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
