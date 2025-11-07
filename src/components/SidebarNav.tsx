"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

// Import new modular components
import { SidebarProfileSection } from './sidebar-sections/SidebarProfileSection';
import { SidebarNavItems } from './sidebar-sections/SidebarNavItems';
import { SidebarYearSelector } from './sidebar-sections/SidebarYearSelector';
import { SidebarAuthButton } from './sidebar-sections/SidebarAuthButton';

interface SidebarNavProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ selectedYear, setSelectedYear }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { isSidebarOpen, toggleSidebar, sidebarWidthClass } = useSidebar();

  const isCollapsed = !isSidebarOpen;

  const renderNavContent = (isCollapsedProp: boolean, setIsSheetOpenProp?: (open: boolean) => void) => (
    <div className={cn("flex h-full flex-col justify-between", isCollapsedProp ? "px-2" : "p-4")}>
      {/* User Profile Section */}
      <SidebarProfileSection isCollapsed={isCollapsedProp} />

      {!isCollapsedProp && (
        <h2 className="text-xl font-bold font-orbitron gradient-text mb-6 text-center">
          Gestão Logística
        </h2>
      )}

      {/* Scrollable navigation area */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <SidebarNavItems isCollapsed={isCollapsedProp} setIsSheetOpen={setIsSheetOpenProp} />
        <SidebarYearSelector selectedYear={selectedYear} setSelectedYear={setSelectedYear} isCollapsed={isCollapsedProp} />
      </div>

      {/* Auth Button Section */}
      <SidebarAuthButton isCollapsed={isCollapsedProp} setIsSheetOpen={setIsSheetOpenProp} />
    </div>
  );

  return isMobile ? (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetContent side="left" className="w-64 bg-sidebar border-sidebar-border p-0">
        {renderNavContent(false, setIsSheetOpen)} {/* Always not collapsed in mobile sheet */}
      </SheetContent>
    </Sheet>
  ) : (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full border-r border-border/30 bg-sidebar transition-all duration-300 ease-in-out z-40 flex flex-col",
        sidebarWidthClass
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "absolute top-4",
          isCollapsed ? "right-4" : "right-1/2 transform translate-x-1/2"
        )}
      >
        {isCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </Button>
      <div className="flex-1 overflow-y-auto pt-16">
        {renderNavContent(isCollapsed)}
      </div>
    </aside>
  );
};