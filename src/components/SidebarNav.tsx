import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Package,
  Route,
  TrendingUp,
  Gauge,
  ListChecks,
  Users,
  Brain,
  Zap,
  LogOut,
  CheckCircle,
  ChevronLeft, // Novo ícone
  ChevronRight, // Novo ícone
  Menu,
  User as UserIcon, // Renomeado para evitar conflito com o componente User
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext'; // Importar o contexto do sidebar

export const SidebarNav = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false); // Para o sheet mobile
  const { isSidebarOpen, toggleSidebar, sidebarWidthClass } = useSidebar(); // Usa o contexto para o sidebar desktop

  // handleAuthButtonClick e o botão de login/logout foram movidos para o AuthButton.tsx

  const navItems = [
    {
      label: 'Dashboard',
      icon: Brain,
      path: '/',
      roles: ['standard', 'admin'],
    },
    {
      label: 'Agendar Coleta',
      icon: Package,
      path: '/agendar-coleta',
      roles: ['standard', 'admin'],
    },
    {
      label: 'Rota Inteligente',
      icon: Route,
      path: '/rota-inteligente',
      roles: ['standard', 'admin'],
    },
    {
      label: 'Consultar Coletas',
      icon: ListChecks,
      path: '/coletas',
      roles: ['standard', 'admin'],
    },
    {
      label: 'Relatórios',
      icon: TrendingUp,
      path: '/relatorios',
      roles: ['standard', 'admin'],
    },
    {
      label: 'IA Insights',
      icon: Zap,
      path: '/ia-insights',
      roles: ['standard', 'admin'],
    },
    {
      label: 'Gerenciar Métricas',
      icon: Gauge,
      path: '/metrics-management',
      roles: ['admin'],
    },
    {
      label: 'Gerenciar Itens',
      icon: Package,
      path: '/items-management',
      roles: ['admin'],
    },
    {
      label: 'Gerenciar Clientes', // Novo item de navegação
      icon: UserIcon, // Usando UserIcon para clientes
      path: '/client-management',
      roles: ['admin'],
    },
    {
      label: 'Gerenciar Usuários',
      icon: Users,
      path: '/user-management',
      roles: ['admin'],
    },
  ];

  const renderNavContent = (isCollapsed: boolean) => (
    <div className={cn("flex h-full flex-col justify-between space-y-4", isCollapsed ? "px-2" : "p-4")}>
      <div>
        {!isCollapsed && ( // Condicionalmente renderiza o título
          <h2 className="text-xl font-bold font-orbitron gradient-text mb-6 text-center">
            LogiReverseIA
          </h2>
        )}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const showItem = user && item.roles.includes(profile?.role || 'standard');
            if (!showItem) return null;

            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left h-12 text-base hover:bg-primary/10 hover:text-primary',
                  navigate.pathname === item.path && 'bg-primary/10 text-primary font-semibold',
                  isCollapsed && 'justify-center px-0' // Centraliza o ícone quando recolhido
                )}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setIsSheetOpen(false); // Fecha o sheet em mobile na navegação
                }}
              >
                <Icon className={cn(isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5')} />
                {!isCollapsed && item.label} {/* Condicionalmente renderiza o rótulo */}
              </Button>
            );
          })}
        </nav>
      </div>
      {/* O botão de autenticação foi movido para o Dashboard.tsx */}
      <div className="border-t border-border/30 pt-4">
        {/* Conteúdo do rodapé, se houver */}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-card border-r border-border p-0">
          {renderNavContent(false)} {/* O sheet mobile está sempre totalmente aberto */}
        </SheetContent>
      </Sheet>
    );
  }

  // Sidebar para desktop
  return (
    <aside className={cn(
      "fixed top-0 left-0 h-full bg-card border-r border-border z-50 shadow-lg card-futuristic transition-all duration-300 ease-in-out",
      sidebarWidthClass
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-2 h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </Button>
      <div className="pt-16 h-full"> {/* Empurra o conteúdo para baixo para dar espaço ao botão de alternância */}
        {renderNavContent(!isSidebarOpen)}
      </div>
      {!isSidebarOpen && ( // Mostra a versão apenas quando recolhido, centralizado
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          v1.0.0
        </div>
      )}
    </aside>
  );
};