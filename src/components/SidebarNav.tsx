import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Package,
  Route,
  TrendingUp,
  Gauge,
  ListChecks, // Usado para 'Consultar Coletas'
  Users,
  Brain,
  Zap,
  LogOut,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

export const SidebarNav = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { isSidebarOpen, toggleSidebar, sidebarWidthClass } = useSidebar();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    if (isMobile) setIsSheetOpen(false);
  };

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
    // {
    //   label: 'Rota Inteligente',
    //   icon: Route,
    //   path: '/rota-inteligente',
    //   roles: ['standard', 'admin'],
    // },
    {
      label: 'Consultar Coletas',
      icon: ListChecks,
      path: '/coletas',
      roles: ['standard', 'admin'],
    },
    // {
    //   label: 'Situação da Coleta', // Novo item de menu
    //   icon: ListChecks, // Reutilizando o ícone ListChecks
    //   path: '/collection-status',
    //   roles: ['standard', 'admin'],
    // },
    {
      label: 'Relatórios',
      icon: TrendingUp,
      path: '/relatorios',
      roles: ['standard', 'admin'],
    },
    // {
    //   label: 'IA Insights',
    //   icon: Zap,
    //   path: '/ia-insights',
    //   roles: ['standard', 'admin'],
    // },
    {
      label: 'Gerenciar Métricas',
      icon: Gauge,
      path: '/metrics-management',
      roles: ['admin'],
    },
    // {
    //   label: 'Gerenciar Itens',
    //   icon: Package,
    //   path: '/items-management',
    //   roles: ['admin'],
    // },
    {
      label: 'Gerenciar Clientes',
      icon: UserIcon,
      path: '/client-management',
      roles: ['admin'],
    },
    {
      label: 'Gerenciar Produtos', // NOVO ITEM DE MENU
      icon: Package, // Usando o ícone Package para produtos
      path: '/product-management',
      roles: ['standard', 'admin'], // Acesso para todos os usuários autenticados
    },
    {
      label: 'Gerenciar Usuários',
      icon: Users,
      path: '/user-management',
      roles: ['admin'],
    },
    {
      label: 'Sair',
      icon: LogOut,
      path: '/auth', // Redireciona para a página de autenticação após o logout
      roles: ['standard', 'admin'], // Visível para usuários logados
      action: handleLogout, // Ação de logout
    },
  ];

  const renderNavContent = (isCollapsed: boolean) => (
    <div className={cn("flex h-full flex-col justify-between space-y-4", isCollapsed ? "px-2" : "p-4")}>
      <div>
        {!isCollapsed && (
          <h2 className="text-xl font-bold font-orbitron gradient-text mb-6 text-center">
            Gestão Logística
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
                  isCollapsed && 'justify-center px-0'
                )}
                onClick={item.action || (() => {
                  navigate(item.path);
                  if (isMobile) setIsSheetOpen(false);
                })}
              >
                <Icon className={cn(isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5')} />
                {!isCollapsed && item.label}
              </Button>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-border/30 pt-4">
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
          {renderNavContent(false)}
        </SheetContent>
      </Sheet>
    );
  }

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
      <div className="pt-16 h-full">
        {renderNavContent(!isSidebarOpen)}
      </div>
      {!isSidebarOpen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          v1.0.0
        </div>
      )}
    </aside>
  );
};