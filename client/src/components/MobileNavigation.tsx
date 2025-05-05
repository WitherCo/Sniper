import { useLocation, Link } from "wouter";
import { LayoutDashboard, ChevronRight, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNavigation() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#36393F] border-t border-gray-700 p-2 z-10">
      <div className="flex justify-around">
        <Link href="/" className={cn(
            "p-2 rounded-md",
            location === "/" ? "text-white bg-[#5865F2]" : "text-gray-300"
          )}>
          <LayoutDashboard className="h-6 w-6" />
        </Link>

        <Link href="/commands" className={cn(
            "p-2 rounded-md",
            location === "/commands" ? "text-white bg-[#5865F2]" : "text-gray-300"
          )}>
          <ChevronRight className="h-6 w-6" />
        </Link>

        <Link href="/settings" className={cn(
            "p-2 rounded-md",
            location === "/settings" ? "text-white bg-[#5865F2]" : "text-gray-300"
          )}>
          <Settings className="h-6 w-6" />
        </Link>

        <Link href="/documentation" className={cn(
            "p-2 rounded-md",
            location === "/documentation" ? "text-white bg-[#5865F2]" : "text-gray-300"
          )}>
          <FileText className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}