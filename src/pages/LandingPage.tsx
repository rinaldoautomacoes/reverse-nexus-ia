import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Package,
  Truck,
  ListChecks,
  CheckCircle,
  FileText,
  CalendarPlus,
  Brain,
  User as UserIcon,
  Users,
  Rocket,
  Globe,
  Zap,
} from 'lucide-react';
import heroBackground from "@/assets/hero-ai-logistics-dashboard.png";
import { useAuth } from '@/hooks/use-auth';
import { FeatureCards } from '@/components/FeatureCards'; // Importar o novo componente

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Os serviceCards não serão mais renderizados, mas mantidos aqui caso precise de referência futura.
  const serviceCards = [
    {
      title: 'Agendar Coleta',
      description: 'Crie novas solicitações de coleta de materiais.',
      icon: Package,
      path: '/agendar-coleta',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Coletas Ativas',
      description: 'Visualize e gerencie coletas em andamento.',
      icon: ListChecks,
      path: '/coletas-ativas',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Coletas Concluídas',
      description: 'Acompanhe o histórico de coletas finalizadas.',
      icon: CheckCircle,
      path: '/coletas-concluidas',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Relatório de Coletas',
      description: 'Gere relatórios detalhados sobre suas coletas.',
      icon: FileText,
      path: '/relatorios',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Agendar Entrega',
      description: 'Crie novas solicitações de entrega de materiais.',
      icon: CalendarPlus,
      path: '/agendar-entrega',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Entregas Ativas',
      description: 'Visualize e gerencie entregas em andamento.',
      icon: Truck,
      path: '/entregas-ativas',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Entregas Concluídas',
      description: 'Acompanhe o histórico de entregas finalizadas.',
      icon: ListChecks,
      path: '/entregas-concluidas',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Relatório de Entregas',
      description: 'Gere relatórios detalhados sobre suas entregas.',
      icon: FileText,
      path: '/relatorios-entregas',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Gerenciar Clientes',
      description: 'Adicione, edite e remova clientes da sua base.',
      icon: UserIcon,
      path: '/client-management',
      roles: ['admin'],
    },
    {
      title: 'Gerenciar Produtos',
      description: 'Cadastre e organize os produtos da sua operação.',
      icon: Package,
      path: '/product-management',
      roles: ['standard', 'admin'],
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Crie e administre as contas de usuários da plataforma.',
      icon: Users,
      path: '/user-management',
      roles: ['admin'],
    },
    {
      title: 'Gerenciar Métricas',
      description: 'Personalize as métricas exibidas no dashboard.',
      icon: Brain,
      path: '/metrics-management',
      roles: ['admin'],
    },
  ];

  const userName = profile?.first_name || 'Usuário';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section - Upper Card */}
      <div
        className="relative h-[70vh] bg-cover bg-center bg-no-repeat flex flex-col justify-start p-6"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        {/* Darker overlay for better text readability - adjusted opacity */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-darker/60 via-slate-darker/75 to-slate-darker/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-darker/50 via-transparent to-slate-darker/50" />
        
        {/* Glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow animation-delay-200" />
        </div>

        <div className="relative z-10 flex flex-col justify-start pt-12 px-6 lg:px-8">
          {/* Main title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-orbitron gradient-text mb-4 animate-slide-up">
            Plataforma Logística 360
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground/90 mb-8 animate-slide-up animation-delay-200">
            Plataforma Inteligente de Logística
          </p>
        </div>
      </div>

      {/* Feature Cards Section */}
      <FeatureCards />
    </div>
  );
};