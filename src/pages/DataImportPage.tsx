import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DatabaseZap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataImporter } from '@/components/DataImporter';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

export const DataImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Use useAuth to ensure user is loaded

  if (!user) {
    // Optionally, render a loading state or redirect if user is not available
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando autenticação...</p>
        </div>
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
              Importação de Dados
            </h1>
            <p className="text-muted-foreground">
              Envie arquivos (XLSX, CSV, PDF/JSON) para extrair e importar dados automaticamente.
            </p>
          </div>

          <DataImporter onClose={() => navigate('/data-import')} />
        </div>
      </div>
    </div>
  );
};