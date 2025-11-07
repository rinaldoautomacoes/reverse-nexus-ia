import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const EntregasHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Button
        onClick={() => navigate('/dashboard-entregas')}
        variant="ghost"
        className="mb-6 text-primary hover:bg-primary/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar ao Dashboard de Entregas
      </Button>

      <div className="text-center">
        <h1 className="text-4xl font-bold font-orbitron gradient-text mb-4">
          Entregas Ativas
        </h1>
        <p className="text-muted-foreground">
          Gerencie todas as entregas que ainda não foram concluídas.
        </p>
      </div>
    </div>
  );
};