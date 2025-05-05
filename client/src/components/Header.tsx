import { useQuery } from "@tanstack/react-query";
import { BotStatus } from "@/types";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { data: botStatus } = useQuery<BotStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <header className="bg-[#36393F] border-b border-gray-700 py-3 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button className="md:hidden" onClick={toggleSidebar}>
          <Menu className="h-6 w-6" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center">
          <span className="text-xl font-bold">D</span>
        </div>
        <h1 className="text-xl font-bold">
          DiscordBot<span className="text-[#5865F2]">400</span>
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {botStatus && (
          <div className="hidden md:flex items-center">
            <div className={`rounded-full w-2 h-2 mr-2 ${botStatus.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{botStatus.status === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        )}
        
        <Button size="sm" className="py-1 px-3 bg-[#5865F2] hover:bg-opacity-80 transition-colors text-sm">
          Invite Bot
        </Button>
        
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
