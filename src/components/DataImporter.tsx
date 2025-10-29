import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUp, Upload, CheckCircle, XCircle, Loader2, FileText, FileSpreadsheet, Package } from 'lucide-react'; // Added Package icon
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { parseXLSX, parseCSV, parsePDF, ColetaImportData, ProductImportData, parseProductsXLSX, parseProductsCSV, parseProductsJSON } from '@/lib/data-parser'; // Import new product parsers and types
import type { TablesInsert } from '@/integrations/supabase/types_generated';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components

type ColetaInsert = TablesInsert<'coletas'>;
type ProductInsert = TablesInsert<'products'>; // Define ProductInsert type

interface DataImporterProps {
  initialTab?: 'collections' | 'products';
  onImportSuccess?: () => void;
  onClose: () => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({ initialTab = 'collections', onImportSuccess, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ColetaImportData[] | ProductImportData[] | null>(null); // Can be either type
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'products'>(initialTab); // New state for active tab

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedData(null); // Clear previous data
    }
  };

  const handleParseFile = async () => {
    if (!selectedFile) {
      toast({ title: 'Nenhum arquivo selecionado', description: 'Por favor, selecione um arquivo para importar.', variant: 'destructive' });
      return;
    }

    setIsParsing(true);
    setExtractedData(null);

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    try {
      let data: ColetaImportData[] | ProductImportData[] = [];
      if (activeTab === 'collections') {
        if (fileExtension === 'xlsx') {
          data = await parseXLSX(selectedFile);
        } else if (fileExtension === 'csv') {
          data = await parseCSV(selectedFile);
        } else if (fileExtension === 'pdf') {
          toast({
            title: 'Extração de PDF (Simulada)',
            description: 'A extração de PDF está usando dados fictícios. Para uma funcionalidade real, integre uma API de OCR.',
            variant: 'warning',
            duration: 8000,
          });
          data = await parsePDF(selectedFile);
        } else {
          throw new Error('Formato de arquivo não suportado para coletas/entregas. Use XLSX, CSV ou PDF.');
        }
      } else { // activeTab === 'products'
        if (fileExtension === 'xlsx') {
          data = await parseProductsXLSX(selectedFile);
        } else if (fileExtension === 'csv') {
          data = await parseProductsCSV(selectedFile);
        } else if (fileExtension === 'json') {
          data = await parseProductsJSON(selectedFile);
        } else {
          throw new Error('Formato de arquivo não suportado para produtos. Use XLSX, CSV ou JSON.');
        }
      }

      if (data.length === 0) {
        throw new Error('Nenhum dado válido foi extraído do arquivo.');
      }

      setExtractedData(data);
      toast({ title: 'Dados extraídos com sucesso!', description: `Foram encontrados ${data.length} registros para importação.` });

    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error);
      toast({ title: 'Erro ao processar arquivo', description: error.message || 'Arquivo inválido ou dados não reconhecidos.', variant: 'destructive' });
      setExtractedData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const importCollectionsMutation = useMutation({
    mutationFn: async (dataToImport: ColetaImportData[]) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para importar dados.');
      }

      const inserts: ColetaInsert[] = dataToImport.map(item => ({
        user_id: user.id,
        unique_number: item.unique_number,
        client_control: item.client_control,
        parceiro: item.parceiro,
        contato: item.contato,
        telefone: item.telefone,
        email: item.email,
        cnpj: item.cnpj,
        endereco: item.endereco_origem, // Mapeia para o campo principal 'endereco'
        cep: item.cep_origem, // Mapeia para o campo principal 'cep'
        endereco_origem: item.endereco_origem,
        cep_origem: item.cep_origem,
        origin_lat: item.origin_lat,
        origin_lng: item.origin_lng,
        endereco_destino: item.endereco_destino,
        cep_destino: item.cep_destino,
        destination_lat: item.destination_lat,
        destination_lng: item.destination_lng,
        previsao_coleta: item.previsao_coleta,
        qtd_aparelhos_solicitado: item.qtd_aparelhos_solicitado,
        modelo_aparelho: item.modelo_aparelho,
        freight_value: item.freight_value,
        observacao: item.observacao,
        status_coleta: item.status_coleta,
        type: item.type,
      }));

      const { error } = await supabase.from('coletas').insert(inserts);
      if (error) throw new Error(error.message);
      return inserts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['coletasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['itemsForColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasForMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['itemsForEntregasMetrics', user?.id] });
      toast({ title: 'Importação de Coletas/Entregas concluída!', description: `${count} registros foram salvos com sucesso no banco de dados.` });
      setSelectedFile(null);
      setExtractedData(null);
      onImportSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Coletas/Entregas', description: error.message, variant: 'destructive' });
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: async (dataToImport: ProductImportData[]) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para importar produtos.');
      }

      const inserts: ProductInsert[] = dataToImport.map(item => ({
        user_id: user.id,
        code: item.code,
        description: item.description,
        model: item.model,
        serial_number: item.serial_number,
        // image_url is not imported via spreadsheet
      }));

      // Use upsert to ignore duplicates based on 'code' and 'user_id'
      const { error } = await supabase
        .from('products')
        .upsert(inserts, { onConflict: 'code,user_id', ignoreDuplicates: true });
      
      if (error) throw new Error(error.message);
      return inserts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] }); // Invalidate products query
      toast({ title: 'Importação de Produtos concluída!', description: `${count} produtos foram salvos com sucesso no banco de dados, duplicatas foram ignoradas.` });
      setSelectedFile(null);
      setExtractedData(null);
      onImportSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Erro na importação de Produtos', description: error.message, variant: 'destructive' });
    },
  });

  const handleConfirmImport = () => {
    if (!extractedData || extractedData.length === 0) {
      toast({ title: 'Nenhum dado para importar', description: 'Por favor, extraia dados antes de confirmar a importação.', variant: 'destructive' });
      return;
    }

    if (activeTab === 'collections') {
      importCollectionsMutation.mutate(extractedData as ColetaImportData[]);
    } else { // activeTab === 'products'
      importProductsMutation.mutate(extractedData as ProductImportData[]);
    }
  };

  const getFileIcon = (fileName: string | undefined) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return <FileText className="h-5 w-5 text-destructive" />;
      case 'xlsx':
      case 'csv': return <FileSpreadsheet className="h-5 w-5 text-success-green" />;
      case 'json': return <Package className="h-5 w-5 text-neural" />;
      default: return <Package className="h-5 w-5 text-muted-foreground" />; // Changed to Package for generic file
    }
  };

  const isImportPending = importCollectionsMutation.isPending || importProductsMutation.isPending;

  return (
    <div className="space-y-6">
      <Card className="card-futuristic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Upload de Arquivo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value as 'collections' | 'products');
            setSelectedFile(null); // Clear file when changing tab
            setExtractedData(null); // Clear extracted data when changing tab
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="collections">Coletas/Entregas</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
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
          </Tabs>

          <div className="flex items-center gap-4">
            <Input
              id="file-upload"
              type="file"
              accept={activeTab === 'collections' ? ".xlsx,.csv,.pdf" : ".xlsx,.csv,.json"}
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
        </CardContent>
      </Card>

      {extractedData && extractedData.length > 0 && (
        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success-green" />
              Pré-visualização dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="max-h-96 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeTab === 'collections' ? (
                      <>
                        <TableHead>Nº Coleta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Endereço Origem</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Nº Série</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTab === 'collections' ? (
                    (extractedData as ColetaImportData[]).map((item: ColetaImportData, index) => ( // Explicitly type item here
                      <TableRow key={index}>
                        <TableCell>{item.unique_number}</TableCell>
                        <TableCell>{item.type === 'coleta' ? 'Coleta' : 'Entrega'}</TableCell>
                        <TableCell>{item.parceiro}</TableCell>
                        <TableCell>{item.endereco_origem}</TableCell>
                        <TableCell>{format(new Date(item.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell>{item.modelo_aparelho}</TableCell>
                        <TableCell>{item.qtd_aparelhos_solicitado}</TableCell>
                        <TableCell>{item.status_coleta}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    (extractedData as ProductImportData[]).map((item: ProductImportData, index) => ( // Explicitly type item here
                      <TableRow key={index}>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>{item.serial_number}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setExtractedData(null);
                }}
                disabled={isImportPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={isImportPending}
                className="bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect"
              >
                {isImportPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Confirmar Importação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};