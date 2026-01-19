import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bug } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export const PestControlService: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    // Should be handled by ProtectedRoute, but good to have a fallback
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Acesso negado. Por favor, faça login.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
              Controle de Pragas
            </h1>
            <p className="text-muted-foreground">
              Gerencie os serviços de controle de pragas para seus clientes.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-primary" />
                Serviços Agendados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Aqui você poderá visualizar, agendar e gerenciar todos os serviços de controle de pragas.
              </p>
              <div className="mt-4 text-center text-muted-foreground">
                <Bug className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhum serviço de controle de pragas agendado ainda.</p>
                <p className="text-sm">Funcionalidade em desenvolvimento.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};