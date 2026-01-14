"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface SidebarYearSelectorProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  isCollapsed: boolean;
}

export const SidebarYearSelector: React.FC<SidebarYearSelectorProps> = ({ selectedYear, setSelectedYear, isCollapsed }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className={cn("mt-6 pt-4 border-t border-border/30 space-y-2", isCollapsed && "text-center")}>
      {!isCollapsed && <p className="text-sm font-semibold text-muted-foreground mb-2">Visualizar Dados Por Ano:</p>}
      <Button
        variant="outline"
        className={cn(
          `w-full justify-start text-left h-10 text-base bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/80 glow-effect`,
          selectedYear === '2026' ? 'border-2 border-neon-cyan' : 'border-transparent',
          isCollapsed && 'justify-center px-0'
        )}
        onClick={() => setSelectedYear('2026')}
      >
        {!isCollapsed && 'Ano 2026'}
        {isCollapsed && <span className="font-bold text-lg">26</span>}
      </Button>
      <Button
        variant="outline"
        className={cn(
          `w-full justify-start text-left h-10 text-base bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/80 glow-effect`,
          selectedYear === '2027' ? 'border-2 border-neon-cyan' : 'border-transparent',
          isCollapsed && 'justify-center px-0'
        )}
        onClick={() => setSelectedYear('2027')}
      >
        {!isCollapsed && 'Ano 2027'}
        {isCollapsed && <span className="font-bold text-lg">27</span>}
      </Button>
    </div>
  );
};