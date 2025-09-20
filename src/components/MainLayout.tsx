import React from 'react';
import { Outlet } from 'react-router-dom';
import { RecentActivity } from './RecentActivity';
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background ai-pattern">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/30 p-4 z-30 overflow-y-auto shadow-deep">
        <div className="mb-6 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold font-orbitron gradient-text">LogiReverseIA</h2>
        </div>
        <RecentActivity />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-6"> {/* Adjust ml-64 to match sidebar width */}
        <Outlet />
      </main>
    </div>
  );
};