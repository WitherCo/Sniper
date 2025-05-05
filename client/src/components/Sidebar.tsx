import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  FileText,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  return (
    <aside className={cn(
      "w-64 bg-[#36393F] border-r border-gray-700 flex-shrink-0 overflow-y-auto fixed inset-y-0 left-0 z-30 mt-[56px] transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:mt-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <nav className="p-4">
        <ul className="space-y-1">
          <li>
            <Link href="/" className={cn(
              "flex items-center px-3 py-2 rounded",
              location === "/" ? "text-white bg-[#5865F2]" : "text-gray-300 hover:bg-gray-700"
            )}>
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/commands" className={cn(
              "flex items-center px-3 py-2 rounded",
              location === "/commands" ? "text-white bg-[#5865F2]" : "text-gray-300 hover:bg-gray-700"
            )}>
              <ChevronRight className="h-5 w-5 mr-3" />
              Commands
            </Link>
          </li>
          <li>
            <Link href="/settings" className={cn(
              "flex items-center px-3 py-2 rounded",
              location === "/settings" ? "text-white bg-[#5865F2]" : "text-gray-300 hover:bg-gray-700"
            )}>
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </Link>
          </li>
          <li>
            <Link href="/documentation" className={cn(
              "flex items-center px-3 py-2 rounded",
              location === "/documentation" ? "text-white bg-[#5865F2]" : "text-gray-300 hover:bg-gray-700"
            )}>
              <FileText className="h-5 w-5 mr-3" />
              Documentation
            </Link>
          </li>
        </ul>

        {categories && categories.length > 0 && (
          <div className="mt-6">
            <h3 className="px-3 text-xs font-semibold text-[#B9BBBE] uppercase tracking-wider">
              Command Categories
            </h3>
            <div className="mt-2 space-y-1">
              {categories.map((category) => (
                <button 
                  key={category.id}
                  className="w-full text-left px-3 py-2 rounded text-gray-300 hover:bg-gray-700 flex items-center justify-between"
                >
                  <span>{category.name}</span>
                  <span className="bg-[#5865F2] text-xs rounded-full px-2 py-0.5">
                    {category.commandCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="px-3 text-xs font-semibold text-[#B9BBBE] uppercase tracking-wider">
            Developer Tools
          </h3>
          <div className="mt-2 space-y-1">
            <Link href="#" className="block px-3 py-2 rounded text-gray-300 hover:bg-gray-700">
              Command Handler
            </Link>
            <Link href="#" className="block px-3 py-2 rounded text-gray-300 hover:bg-gray-700">
              Slash Command Setup
            </Link>
            <Link href="#" className="block px-3 py-2 rounded text-gray-300 hover:bg-gray-700">
              Event Listeners
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}