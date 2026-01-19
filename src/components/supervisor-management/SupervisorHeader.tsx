import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SupervisorHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Button
        onClick={() => navigate('/')}
        variant="ghost"
        className="mb-6 text-primary hover:bg-primary/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar ao Dashboard
      </Button>

      <div className="text-center">
        <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
          Gerenciar Supervisores Técnicos
        </h1>
        <p className="text-muted-foreground">
          Adicione, edite e remova os supervisores técnicos da sua equipe.
        </p>
      </div>
    </div>
  );
};