import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Command, Category } from "@/types";
import CommandCard from "@/components/CommandCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Commands() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: commands } = useQuery<Command[]>({
    queryKey: ['/api/commands'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Filter commands based on search term and active category
  const filteredCommands = commands?.filter(command => {
    const matchesSearch = command.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          command.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || command.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Commands</h2>
          <p className="text-[#B9BBBE]">Browse and manage all bot commands</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search commands..."
            className="w-full px-4 py-2 bg-[#2F3136] rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="h-5 w-5 absolute right-3 top-2.5 text-gray-400" />
        </div>
      </div>

      {/* Command Categories Tabs */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-[#36393F] border border-gray-700 mb-6 overflow-x-auto flex nowrap">
          <TabsTrigger value="all">All Commands</TabsTrigger>
          {categories?.map(category => (
            <TabsTrigger key={category.id} value={category.name} className="capitalize">
              {category.name} ({category.commandCount})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommands?.map(command => (
              <CommandCard 
                key={command.id} 
                command={command} 
                onEdit={() => {}} 
                onDelete={() => {}} 
              />
            ))}
          </div>
          
          {filteredCommands?.length === 0 && (
            <div className="text-center py-10 bg-[#36393F] rounded-lg border border-gray-700">
              <p className="text-[#B9BBBE]">No commands found matching your criteria.</p>
            </div>
          )}
        </TabsContent>

        {categories?.map(category => (
          <TabsContent key={category.id} value={category.name} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommands?.map(command => (
                <CommandCard 
                  key={command.id} 
                  command={command} 
                  onEdit={() => {}} 
                  onDelete={() => {}} 
                />
              ))}
            </div>
            
            {filteredCommands?.length === 0 && (
              <div className="text-center py-10 bg-[#36393F] rounded-lg border border-gray-700">
                <p className="text-[#B9BBBE]">No commands found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
