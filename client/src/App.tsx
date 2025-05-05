import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Commands from "@/pages/Commands";
import Settings from "@/pages/Settings";
import Documentation from "@/pages/Documentation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import { useState } from "react";

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-[#2F3136] text-white">
        <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} />
          
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/commands" component={Commands} />
              <Route path="/settings" component={Settings} />
              <Route path="/documentation" component={Documentation} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
        
        <MobileNavigation />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
