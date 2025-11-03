import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx'; // Import XLSX
import { ArrowLeft, FileUp, Send, Loader2, XCircle } from 'lucide-react'; // Import Lucide icons
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { generateUniqueNumber } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

// Import components from the new excel-extractor directory
import SpreadsheetView from '@/components/excel-extractor/SpreadsheetView';
import ExtractedDataView from '@/components/excel-extractor/ExtractedDataView';
import { UploadIcon, FileIcon, ClearIcon } from '@/components/excel-extractor/Icons';
import type { TablesInsert } from '@/integrations/supabase/types_generated';
import { parseSelectedSpreadsheetCells } from '@/lib/document-parser'; // Import new parser
import type { ParsedCollectionData } from '@/lib/types'; // Import from new types file

type ExcelData = (string | number | null)[][];
type SelectedCells = Set<string>;
type ColetaInsert = TablesInsert<'coletas'>;

export const ExcelExtractorPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [data, setData] = useState<ExcelData>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<SelectedCells>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reseta o input de arquivo para permitir o re-upload do mesmo arquivo
    event.target.value = '';
  };

  const processFile = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: ExcelData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

        const initialSelectedCells = new Set<string>();
        jsonData.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (cell !== null && cell !== '' && cell !== undefined) {
              initialSelectedCells.add(`${rowIndex}:${colIndex}`);
            }
          });
        });
        
        setData(jsonData);
        setSelectedCells(initialSelectedCells);
        toast({ title: "Arquivo carregado", description: `"${file.name}" processado com sucesso. Células não vazias pré-selecionadas.` });
      } catch (err: any) {
        setError('Falha ao analisar o arquivo Excel. Por favor, garanta que é um formato válido.');
        toast({ title: "Erro ao carregar arquivo", description: err.message || 'Falha ao analisar o arquivo Excel. Por favor, garanta que é um formato válido.', variant: "destructive" });
        setData([]);
        setSelectedCells(new Set());
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setError('Falha ao ler o arquivo.');
        toast({ title: "Erro ao ler arquivo", description: 'Falha ao ler o arquivo.', variant: "destructive" });
        setIsLoading(false);
    }
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleCellClick = useCallback((rowIndex: number, colIndex: number) => {
    const cellKey = `${rowIndex}:${colIndex}`;
    setSelectedCells(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(cellKey)) {
        newSelected.delete(cellKey);
      } else {
        newSelected.add(cellKey);
      }
      return newSelected;
    });
  }, []);

  const clearSelection = () => {
    setSelectedCells(new Set());
    toast({ title: "Seleção Limpa", description: "Todas as células foram desmarcadas." });
  };

  const hasData = useMemo(() => data.length > 0, [data]);

  const extractedText = useMemo(() => {
    if (selectedCells.size === 0) {
      return '';
    }

    const extracted: string[] = [];
    // Para preservar a ordem, podemos iterar sobre a grade de dados
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (selectedCells.has(`${rowIndex}:${colIndex}`)) {
            if (cell !== null && cell !== undefined) {
                extracted.push(String(cell));
            }
        }
      });
    });
    
    return extracted.join('\n');
  }, [data, selectedCells]);

  // Modificado: Ação do botão agora navega para a página de agendamento automático
  const handleReviewAndSchedule = () => {
    if (selectedCells.size === 0) {
      toast({ title: "Nenhum dado para agendar", description: "Por favor, selecione células para extrair.", variant: "destructive" });
      return;
    }
    
    // Use the new parser to get all structured data
    const parsedCollectionData = parseSelectedSpreadsheetCells(data, Array.from(selectedCells));

    navigate('/agendamento-automatico', { 
      state: { 
        parsedCollectionData: parsedCollectionData 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background ai-pattern p-6">
      <div className="max-w-7xl mx-auto">
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
              Extrator Interativo de Dados do Excel
            </h1>
            <p className="text-muted-foreground">
              Faça o upload de um arquivo Excel para visualizar e marcar as células para extração.
            </p>
          </div>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-primary hover:bg-gradient-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                  <UploadIcon className="w-5 h-5 mr-2 -ml-1" />
                  <span>{fileName ? 'Carregar Outro Arquivo' : 'Carregar Arquivo Excel'}</span>
                </label>
                <input id="file-upload" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                
                {hasData && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileIcon className="w-5 h-5 mr-2 text-success-green" />
                      <span className="font-medium truncate max-w-[200px]">{fileName}</span>
                    </div>
                    <Button onClick={clearSelection} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                      <XCircle className="w-4 h-4 mr-2" />
                      Limpar Seleção
                    </Button>
                  </div>
                )}
              </div>
              
              {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md text-sm">{error}</div>}
            </CardContent>
          </Card>

          <Card className="card-futuristic">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Processando seu arquivo...</p>
                </div>
              ) : hasData ? (
                <div className="space-y-6">
                    <SpreadsheetView data={data} selectedCells={selectedCells} onCellClick={handleCellClick} />
                    <ExtractedDataView extractedText={extractedText} />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleReviewAndSchedule}
                        disabled={selectedCells.size === 0}
                        className="bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Revisar e Agendar Coleta
                      </Button>
                    </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">Nenhum arquivo carregado</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Comece fazendo o upload de um arquivo Excel.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};