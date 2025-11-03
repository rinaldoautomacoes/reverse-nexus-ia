import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Upload, Loader2, FileText, FileSpreadsheet, Package } from 'lucide-react';

interface ImportFileSectionProps {
  activeTab: 'collections' | 'products' | 'clients';
  setActiveTab: (tab: 'collections' | 'products' | 'clients') => void;
  selectedFile: File | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleParseFile: () => void;
  isParsing: boolean;
  isImportPending: boolean;
  error: string | null;
}

const getFileIcon = (fileName: string | undefined) => {
  const extension = fileName?.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return <FileText className="h-5 w-5 text-destructive" />;
    case 'xlsx':
    case 'xls':
    case 'csv': return <FileSpreadsheet className="h-5 w-5 text-success-green" />;
    case 'json': return <Package className="h-5 w-5 text-neural" />;
    default: return <Package className="h-5 w-5 text-muted-foreground" />;
  }
};

export const ImportFileSection: React.FC<ImportFileSectionProps> = ({
  activeTab,
  setActiveTab,
  selectedFile,
  handleFileChange,
  handleParseFile,
  isParsing,
  isImportPending,
  error,
}) => {
  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" />
          Upload de Arquivo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'collections' | 'products' | 'clients')} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collections">Coletas/Entregas</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
          </TabsList>
          <TabsContent value="collections" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Envie arquivos (XLSX, CSV, PDF) para extrair e importar dados de coletas/entregas automaticamente.
            </p>
          </TabsContent>
          <TabsContent value="products" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Envie arquivos (XLSX, CSV, JSON) para extrair e importar dados de produtos automaticamente. Duplicatas serão ignoradas.
            </p>
          </TabsContent>
          <TabsContent value="clients" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Envie arquivos (XLSX, CSV, JSON) para extrair e importar dados de clientes automaticamente. Duplicatas serão ignoradas.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-4">
          <Input
            id="file-upload"
            type="file"
            accept={
              activeTab === 'collections' ? ".xlsx,.csv,.pdf" :
              activeTab === 'products' ? ".xlsx,.csv,.json" :
              ".xlsx,.csv,.json"
            }
            onChange={handleFileChange}
            className="flex-1"
            disabled={isParsing || isImportPending}
          />
          <Button
            onClick={handleParseFile}
            disabled={!selectedFile || isParsing || isImportPending}
            className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
          >
            {isParsing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Processar Arquivo
          </Button>
        </div>
        {selectedFile && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getFileIcon(selectedFile.name)}
            <span>{selectedFile.name}</span>
          </div>
        )}
        {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md text-sm">{error}</div>}
      </CardContent>
    </Card>
  );
};