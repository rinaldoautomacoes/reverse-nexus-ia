"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  Package,
  Route,
  TrendingUp,
  Gauge,
  ListChecks,
  Users,
  Brain,
  Truck,
  ClipboardCheck,
  CalendarPlus,
  FileText,
  Home,
  Building,
  FileSpreadsheet,
  ClipboardList,
  FileUp,
  UserSquare,
  CheckCircle,
  Bug, // 'Mosquito' removido daqui
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
  group: string;
}

const navItems: NavItem[] = [
  {
    label: 'Página Inicial',
    icon: Home,
    path: '/',
    roles: ['standard', 'admin'],
    group: 'main',
  },
  {
    label: 'Dashboard Geral',
    icon: TrendingUp,
    path: '/dashboard-geral',
    roles: ['admin'], // Alterado para permitir APENAS administradores
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
    icon: FileUp,
    path: '/data-import',
    roles: ['admin'], // Alterado para permitir APENAS administradores
    group: 'management',
  },
  {
    label: 'Agendamento Automático',
    icon: ClipboardList,
    path: '/agendamento-automatico',
    roles: ['admin'], // Alterado para permitir APENAS administradores
    group: 'management',
  },
  {
    label: 'Extrator Excel',
    icon: FileSpreadsheet,
    path: '/excel-extractor',
    roles: ['admin'], // Alterado para permitir APENAS administradores
    group: 'management',
  },
  {
    label: 'Gerenciar Motoristas',
    icon: Truck,
    path: '/driver-management',
    roles: ['admin'], // Alterado para permitir APENAS administradores
    group: 'management',
  },
  {
    label: 'Gerenciar Transportadoras',
    icon: Building,
    path: '/transportadora-management',
    roles: ['admin'], // Alterado para permitir APENAS administradores
    group: 'management',
  },
  {
    label: 'Gerenciar Clientes',
    icon: UserSquare,
    path: '/client-management',
    roles: ['admin'], // Alterado para permitir APENAS administradores
    group: 'management',
  },
  {
    label: 'Gerenciar Produtos',
    icon: Package,
    path: '/product-management',
    roles: ['admin'], // Alterado para permitir APENAS administradores
    group: 'management',
  },
  {
    label: 'Gerenciar Usuários',
    icon: Users,
    path: '/user-management',
    roles: ['admin'], // Alterado para permitir APENAS administradores
    group: 'management',
  },
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
  {
    label: 'Controle de Pragas', // New item
    icon: Bug, // New icon
    path: '/pest-control', // New path
    roles: ['standard', 'admin'],
    group: 'coleta-services', // Added to existing group for now
  },
];

interface SidebarNavItemsProps {
  isCollapsed: boolean;
  setIsSheetOpen?: (open: boolean) => void; // Optional for mobile sheet
}

export const SidebarNavItems: React.FC<SidebarNavItemsProps> = ({ isCollapsed, setIsSheetOpen }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();

  const renderNavItem = (item: NavItem, isCollapsedProp: boolean) => {
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
          isCollapsedProp && 'justify-center px-0'
        )}
        onClick={() => {
          navigate(item.path);
          if (isMobile && setIsSheetOpen) setIsSheetOpen(false);
        }}
      >
        <Icon className={cn(isCollapsedProp ? 'h-6 w-6' : 'mr-3 h-5 w-5')} />
        {!isCollapsedProp && item.label}
      </Button>
    );

    return isCollapsedProp ? (
      <Tooltip key={item.path} delayDuration={0}>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    ) : (
      buttonContent
    );
  };

  if (!user) {
    return null;
  }

  // Filter items based on user role for each group
  const mainNavItems = navItems.filter(item => item.group === 'main' && user && item.roles.includes(profile?.role || 'standard'));
  const managementNavItems = navItems.filter(item => item.group === 'management' && user && item.roles.includes(profile?.role || 'standard'));
  const coletaServicesNavItems = navItems.filter(item => item.group === 'coleta-services' && user && item.roles.includes(profile?.role || 'standard'));
  const entregaServicesNavItems = navItems.filter(item => item.group === 'entrega-services' && user && item.roles.includes(profile?.role || 'standard'));

  return (
    <nav className="space-y-2">
      {/* Main Navigation Items */}
      {mainNavItems.map(item => renderNavItem(item, isCollapsed))}

      {/* Management Items Accordion */}
      {managementNavItems.length > 0 && ( // Only render if there are accessible management items
        isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-center px-0 h-12 text-base hover:bg-primary/10 hover:text-primary',
                  managementNavItems.some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                )}
                onClick={() => {
                  const firstManagementPath = managementNavItems[0]?.path;
                  if (firstManagementPath) navigate(firstManagementPath);
                  if (isMobile && setIsSheetOpen) setIsSheetOpen(false);
                }}
              >
                <Gauge className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Gerenciamento</TooltipContent>
          </Tooltip>
        ) : (
          <Accordion type="single" collapsible defaultValue={managementNavItems.some(item => window.location.pathname === item.path) ? "management-services" : undefined}>
            <AccordionItem value="management-services" className="border-b-0">
              <AccordionTrigger
                className={cn(
                  "flex items-center w-full justify-start text-left h-12 text-base hover:bg-primary/10 hover:text-primary",
                  managementNavItems.some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <Gauge className="mr-3 h-5 w-5" />
                Gerenciamento
              </AccordionTrigger>
              <AccordionContent className="pl-4">
                {managementNavItems.map(item => (
                  renderNavItem({ ...item, label: item.label.replace('Gerenciar ', '') }, false)
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      )}

      {/* Coleta Services Accordion */}
      {coletaServicesNavItems.length > 0 && ( // Only render if there are accessible coleta services items
        isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-center px-0 h-12 text-base hover:bg-primary/10 hover:text-primary',
                  coletaServicesNavItems.some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                )}
                onClick={() => {
                  navigate('/coletas-dashboard');
                  if (isMobile && setIsSheetOpen) setIsSheetOpen(false);
                }}
              >
                <Package className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Serviços de Coletas</TooltipContent>
          </Tooltip>
        ) : (
          <Accordion type="single" collapsible defaultValue={coletaServicesNavItems.some(item => window.location.pathname === item.path) ? "coletas-services" : undefined}>
            <AccordionItem value="coletas-services" className="border-b-0">
              <AccordionTrigger
                className={cn(
                  "flex items-center w-full justify-start text-left h-12 text-base hover:bg-primary/10 hover:text-primary",
                  coletaServicesNavItems.some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <Package className="mr-3 h-5 w-5" />
                Serviços de Coletas
              </AccordionTrigger>
              <AccordionContent className="pl-4">
                {coletaServicesNavItems.map(item => renderNavItem(item, false))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      )}

      {/* Entrega Services Accordion */}
      {entregaServicesNavItems.length > 0 && ( // Only render if there are accessible entrega services items
        isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-center px-0 h-12 text-base hover:bg-primary/10 hover:text-primary',
                  entregaServicesNavItems.some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                )}
                onClick={() => {
                  navigate('/dashboard-entregas');
                  if (isMobile && setIsSheetOpen) setIsSheetOpen(false);
                }}
              >
                <Truck className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Serviços de Entregas</TooltipContent>
          </Tooltip>
        ) : (
          <Accordion type="single" collapsible defaultValue={entregaServicesNavItems.some(item => window.location.pathname === item.path) ? "entregas-services" : undefined}>
            <AccordionItem value="entregas-services" className="border-b-0">
              <AccordionTrigger
                className={cn(
                  "flex items-center w-full justify-start text-left h-12 text-base hover:bg-primary/10 hover:text-primary",
                  entregaServicesNavItems.some(item => window.location.pathname === item.path) && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <Truck className="mr-3 h-5 w-5" />
                Serviços de Entregas
              </AccordionTrigger>
              <AccordionContent className="pl-4">
                {entregaServicesNavItems.map(item => renderNavItem(item, false))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      )}
    </nav>
  );
};