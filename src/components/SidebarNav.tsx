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

interface SidebarNavProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ selectedYear, setSelectedYear }) => {
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
    {
      label: 'Coletas Ativas', // Nome atualizado
      icon: ListChecks,
      path: '/coletas-ativas', // Rota atualizada
      roles: ['standard', 'admin'],
    },
    {
      label: 'Coletas Concluídas', // NOVO ITEM DE MENU
      icon: CheckCircle, // Ícone para coletas concluídas
      path: '/coletas-concluidas', // NOVA ROTA
      roles: ['standard', 'admin'],
    },
    {
      label: 'Relatórios',
      icon: TrendingUp,
      path: '/relatorios',
      roles: ['standard', 'admin'],
    },
    {
      label: 'Gerenciar Métricas',
      icon: Gauge,
      path: '/metrics-management',
      roles: ['admin'],
    },
    {
      label: 'Gerenciar Clientes',
      icon: UserIcon,
      path: '/client-management',
      roles: ['admin'],
    },
    {
      label: 'Gerenciar Produtos',
      icon: Package,
      path: '/product-management',
      roles: ['standard', 'admin'],
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

        {/* Botões de seleção de ano */}
        {user && (
          <div className={cn("mt-6 pt-4 border-t border-border/30 space-y-2", isCollapsed && "text-center")}>
            {!isCollapsed && <p className="text-sm font-semibold text-muted-foreground mb-2">Visualizar Dados Por Ano:</p>}
            <Button 
              variant="outline" 
              className={cn(
                `w-full justify-start text-left h-10 text-base bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/80 glow-effect`,
                selectedYear === '2025' ? 'border-2 border-neon-cyan' : 'border-transparent',
                isCollapsed && 'justify-center px-0'
              )}
              onClick={() => setSelectedYear('2025')}
            >
              {!isCollapsed && 'Ano Atual 2025'}
              {isCollapsed && <span className="font-bold text-lg">25</span>}
            </Button>
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
          </div>
        )}
      </div>
      <div className="border-t border-border/30 pt-4">
        {user ? (
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left h-12 text-base border-destructive text-destructive hover:bg-destructive/10",
              isCollapsed && 'justify-center px-0'
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn(isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5')} />
            {!isCollapsed && 'Sair'}
          </Button>
        ) : (
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left h-12 text-base border-neural text-neural hover:bg-neural/10",
              isCollapsed && 'justify-center px-0'
            )}
            onClick={() => {
              navigate('/auth');
              if (isMobile) setIsSheetOpen(false);
            }}
          >
            <CheckCircle className={cn(isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5')} />
            {!isCollapsed && 'Login / Cadastro'}
          </Button>
        )}
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