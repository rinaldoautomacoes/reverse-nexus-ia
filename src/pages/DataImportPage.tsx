import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DatabaseZap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataImporter } from '@/components/DataImporter';
import type { DataImporterProps } from '@/components/DataImporter'; // Import the props type

export const DataImportPage: React.FC = () => {
  const navigate = useNavigate();

  const handleImportSuccess: DataImporterProps['onImportSuccess'] = (importedType) => {
    if (importedType === 'technicians') {
      navigate('/technician-management');
    } else if (importedType === 'clients') {
      navigate('/client-management');
    } else if (importedType === 'products') {
      navigate('/product-management');
    } else {
      navigate('/'); // Default to home or general dashboard
    }
  };

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

          <DataImporter 
            onClose={() => navigate('/data-import')} 
            onImportSuccess={handleImportSuccess} 
          />
        </div>
      </div>
    </div>
  );
};