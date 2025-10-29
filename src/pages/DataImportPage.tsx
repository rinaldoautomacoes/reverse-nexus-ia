import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DatabaseZap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataImporter } from '@/components/DataImporter';

export const DataImportPage: React.FC = () => {
  const navigate = useNavigate();

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

          <DataImporter onClose={() => navigate('/')} />
        </div>
      </div>
    </div>
  );
};