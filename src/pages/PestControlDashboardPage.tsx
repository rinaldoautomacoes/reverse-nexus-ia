import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LayoutDashboard, Bug } from 'lucide-react';
import heroBackground from "@/assets/hero-background.jpg"; // Reusing existing hero background
import { useAuth } from '@/hooks/use-auth';

interface PestControlDashboardPageProps {
  selectedYear: string;
}

export const PestControlDashboardPage: React.FC<PestControlDashboardPageProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Acesso negado. Por favor, faça login.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-darker/90 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-start pt-12 h-full px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-5xl lg:text-7xl font-bold font-orbitron gradient-text mb-4 animate-slide-up">
              Dashboard Controle de Pragas
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 animate-slide-up animation-delay-200">
              Visão geral e métricas em tempo real dos serviços de controle de pragas
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 lg:px-8 py-8 space-y-8">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard Geral
        </Button>

        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              Métricas de Controle de Pragas ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Esta seção exibirá métricas e gráficos relacionados aos serviços de controle de pragas.
            </p>
            <div className="mt-4 text-center text-muted-foreground">
              <LayoutDashboard className="h-12 w-12 mx-auto mb-4" />
              <p>Dados do dashboard de controle de pragas em desenvolvimento.</p>
              <p className="text-sm">Aguarde por análises inteligentes e insights!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};