import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Package,
  Route,
  TrendingUp, // Usado para o Dashboard Geral
  Gauge,
  ListChecks,
  Users,
  Brain,
  Zap,
  LogOut,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  User as UserIcon,
  Truck,
  ClipboardCheck,
  CalendarPlus,
  FileText,
  Home, // Usado para a Página Inicial
  Building,
  DatabaseZap,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UserProfileCard } from './UserProfileCard';

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
      label: 'Página Inicial', // Alterado para Página Inicial
      icon: Home,
      path: '/',
      roles: ['standard', 'admin'],
      group: 'main',
    },
    {
      label: 'Dashboard Geral', // Novo item para o Dashboard Geral
      icon: TrendingUp, // Ícone diferente para o dashboard
      path: '/dashboard-geral',
      roles: ['standard', 'admin'],
      group: 'main',
    },
    {
      label: 'Roteirização',
      icon: Route,
      path: '/roteirizacao',
      roles: ['standard', 'admin'],
      group: 'main',
    },
    {
      label: 'Importar Dados',
      icon: DatabaseZap,
      path: '/data-import',
      roles: ['admin'],
      group: 'management',
    },
    {
      label: 'Gerenciar Motoristas',
      icon: Truck,
      path: '/driver-management',
      roles: ['admin'],
      group: 'management',
    },
    {
      label: 'Gerenciar Transportadoras',
      icon: Building,
      path: '/transportadora-management',
      roles: ['admin'],
      group: 'management',
    },
    {
      label: 'Gerenciar Clientes',
      icon: UserIcon,
      path: '/client-management',
      roles: ['admin'],
      group: 'management',
    },
    {
      label: 'Gerenciar Produtos',
      icon: Package,
      path: '/product-management',
      roles: ['standard', 'admin'],
      group: 'management',
    },
    {
      label: 'Gerenciar Usuários',
      icon: Users,
      path: '/user-management',
      roles: ['admin'],
      group: 'management',
    },
    {
      label: 'Gerenciar Métricas',
      icon: Gauge,
      path: '/metrics-management',
      roles: ['admin'],
      group: 'management',
    },
    // Coleta Services
    {
      label: 'Dashboard Coletas',
      icon: Brain,
      path: '/coletas-dashboard',
      roles: ['standard', 'admin'],
      group: 'coleta-services',
    },
    {
      label: 'Agendar Coleta',
      icon: Package,
      path: '/agendar-coleta',
      roles: ['standard', 'admin'],
      group: 'coleta-services',
    },
    {
      label: 'Coletas Ativas',
      icon: ListChecks,
      path: '/coletas-ativas',
      roles: ['standard', 'admin'],
      group: 'coleta-services',
    },
    {
      label: 'Coletas Concluídas',
      icon: CheckCircle,
      path: '/coletas-concluidas',
      roles: ['standard', 'admin'],
      group: 'coleta-services',
    },
    {
      label: 'Relatório de Coletas',
      icon: FileText,
      path: '/relatorios',
      roles: ['standard', 'admin'],
      group: 'coleta-services',
    },
    // Entrega Services
    {
      label: 'Dashboard Entregas',
      icon: Truck,
      path: '/dashboard-entregas',
      roles: ['standard', 'admin'],
      group: 'entrega-services',
    },
    {
      label: 'Agendar Entrega',
      icon: CalendarPlus,
      path: '/agendar-entrega',
      roles: ['standard', 'admin'],
      group: 'entrega-services',
    },
    {
      label: 'Entregas Ativas',
      icon: Truck,
      path: '/entregas-ativas',
      roles: ['standard', 'admin'],
      group: 'entrega-services',
    },
    {
      label: 'Entregas Concluídas',
      icon: ClipboardCheck,
      path: '/entregas-concluidas',
      roles: ['standard', 'admin'],
      group: 'entrega-services',
    },
    {
      label: 'Relatório de Entregas',
      icon: FileText,
      path: '/relatorios-entregas',
      roles: ['standard', 'admin'],
      group: 'entrega-services',
    },
  ];

  const renderNavItem = (item: typeof navItems[0], isCollapsed: boolean) => {
    const Icon = item.icon;
    const showItem = user && item.roles.includes(profile?.role || 'standard');
    if (!showItem) return null;

    const buttonContent = (
      <Button
        key={item.path}
        variant="ghost"
        className={cn(
          'w-full justify-start text-left h-12 text-base hover:bg-primary/10 hover:text-primary',
          window.location.pathname === item.path && 'bg-primary/10 text-primary font-semibold',
          isCollapsed && 'justify-center px-0'
        )}
        onClick={() => {
          navigate(item.path);
          if (isMobile) setIsSheetOpen(false);
        }}
      >
        <Icon className={cn(isCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5')} />
        {!isCollapsed && item.label}
      </Button>
    );

    return isCollapsed ? (
      <Tooltip key={item.path} delayDuration={0}>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    ) : (
      buttonContent
    );
  };

  const renderNavContent = (isCollapsed: boolean) => (
    <div className={cn("flex h-full flex-col justify-between", isCollapsed ? "px-2" : "p-4")}>
      {/* Fixed top section: User Profile and Title */}
      <div>
        {user && (
          <div className="mb-6">
            <UserProfileCard isCollapsed={isCollapsed} />
          </div>
        )}

        {!isCollapsed && (
          <h2 className="text-xl font-bold font-orbitron gradient-text mb-6 text-center">
            Gestão Logística
          </h2>
        )}
      </div>

      {/* Scrollable navigation area */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <nav className="space-y-2">
          {user && (
            <>
              {/* Main Navigation Items */}
              {navItems.filter(item => item.group === 'main').map(item => renderNavItem(item, isCollapsed))}

              {/* Management Items Accordion */}
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-center px-0 h-12 text-base hover:bg-primary/10 hover:text-primary',
                        navItems.filter(item => item.group === 'management').some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                      )}
                      onClick={() => {
                        // Navigate to the first management item or a default if clicked collapsed
                        const firstManagementPath = navItems.find(item => item.group === 'management' && user && item.roles.includes(profile?.role || 'standard'))?.path;
                        if (firstManagementPath) navigate(firstManagementPath);
                        if (isMobile) setIsSheetOpen(false);
                      }}
                    >
                      <Gauge className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Gerenciamento</TooltipContent>
                </Tooltip>
              ) : (
                <Accordion type="single" collapsible defaultValue={navItems.filter(item => item.group === 'management').some(item => window.location.pathname === item.path) ? "management-services" : undefined}>
                  <AccordionItem value="management-services" className="border-b-0">
                    <AccordionTrigger
                      className={cn(
                        "flex items-center w-full justify-start text-left h-12 text-base hover:bg-primary/10 hover:text-primary",
                        navItems.filter(item => item.group === 'management').some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                      )}
                    >
                      <Gauge className="mr-3 h-5 w-5" />
                      Gerenciamento
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      {navItems.filter(item => item.group === 'management').map(item => (
                        renderNavItem({ ...item, label: item.label.replace('Gerenciar ', '') }, false) // Remove 'Gerenciar ' for sub-items
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Coleta Services Accordion */}
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-center px-0 h-12 text-base hover:bg-primary/10 hover:text-primary',
                        navItems.filter(item => item.group === 'coleta-services').some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                      )}
                      onClick={() => {
                        navigate('/coletas-dashboard');
                        if (isMobile) setIsSheetOpen(false);
                      }}
                    >
                      <Package className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Serviços de Coletas</TooltipContent>
                </Tooltip>
              ) : (
                <Accordion type="single" collapsible defaultValue={navItems.filter(item => item.group === 'coleta-services').some(item => window.location.pathname === item.path) ? "coletas-services" : undefined}>
                  <AccordionItem value="coletas-services" className="border-b-0">
                    <AccordionTrigger
                      className={cn(
                        "flex items-center w-full justify-start text-left h-12 text-base hover:bg-primary/10 hover:text-primary",
                        navItems.filter(item => item.group === 'coleta-services').some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                      )}
                    >
                      <Package className="mr-3 h-5 w-5" />
                      Serviços de Coletas
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      {navItems.filter(item => item.group === 'coleta-services').map(item => renderNavItem(item, false))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Entrega Services Accordion */}
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-center px-0 h-12 text-base hover:bg-primary/10 hover:text-primary',
                        navItems.filter(item => item.group === 'entrega-services').some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                      )}
                      onClick={() => {
                        navigate('/dashboard-entregas');
                        if (isMobile) setIsSheetOpen(false);
                      }}
                    >
                      <Truck className="h-6 w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Serviços de Entregas</TooltipContent>
                </Tooltip>
              ) : (
                <Accordion type="single" collapsible defaultValue={navItems.filter(item => item.group === 'entrega-services').some(item => window.location.pathname === item.path) ? "entregas-services" : undefined}>
                  <AccordionItem value="entregas-services" className="border-b-0">
                    <AccordionTrigger
                      className={cn(
                        "flex items-center w-full justify-start text-left h-12 text-base hover:bg-primary/10 hover:text-primary",
                        navItems.filter(item => item.group === 'entrega-services').some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                      )}
                    >
                      <Truck className="mr-3 h-5 w-5" />
                      Serviços de Entregas
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                      {navItems.filter(item => item.group === 'entrega-services').map(item => renderNavItem(item, false))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          )}
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
              {!isCollapsed && 'Ano 2025'}
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

      {/* Fixed bottom section: Logout/Login button */}
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

  return isMobile ? (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-50 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {renderNavContent(false)}
      </SheetContent>
    </Sheet>
  ) : (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-40 flex flex-col transition-all duration-300 ease-in-out",
        sidebarWidthClass
      )}
    >
      {/* Header com o botão de toggle */}
      <div className="flex items-center justify-between p-4 h-16">
        {!isSidebarOpen && (
          <h2 className="text-xl font-bold font-orbitron gradient-text text-center w-full">
            GL
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "rounded-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isSidebarOpen ? "ml-auto" : "mx-auto"
          )}
        >
          {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>
      {/* Conteúdo principal da navegação */}
      {renderNavContent(!isSidebarOpen)}
    </aside>
  );
};