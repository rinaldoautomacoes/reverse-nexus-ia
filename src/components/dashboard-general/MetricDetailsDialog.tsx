import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Package, 
  Truck, 
  Clock, 
  CheckCircle,
  ListChecks, 
  Box, 
  TrendingUp,
  Download, // Importar ícone de download
  FileText, // Ícone para PDF
  FileSpreadsheet, // Ícone para CSV
  Loader2, // Importar Loader2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Importar componentes de tabela
import { Button } from '@/components/ui/button'; // Importar Button
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importar DropdownMenu components
import { generateItemsReport } from '@/lib/report-utils'; // Importar a nova função de utilitário
import { useToast } from '@/hooks/use-toast'; // Importar useToast

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Truck,
  Clock,
  CheckCircle,
  ListChecks,
  Box,
  TrendingUp
};

interface MetricItem {
  id: string;
  title: string;
  value: string;
  description?: string;
  icon_name?: string;
  color?: string;
  bg_color?: string;
  coletasCount?: number;
  entregasCount?: number;
  allItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[];
  pendingItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[];
  inTransitItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[]; // Novo campo
  completedItemsDetails?: { quantity: number; name: string; description: string; type: 'coleta' | 'entrega'; }[]; // Novo campo
}

interface MetricDetailsDialogProps {
  metric: MetricItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MetricDetailsDialog: React.FC<MetricDetailsDialogProps> = ({ metric, isOpen, onClose }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);

  if (!metric) return null;

  const Icon = metric.icon_name ? iconMap[metric.icon_name] : null;

  let itemsToDisplay: MetricItem['allItemsDetails'] | undefined;
  let itemsSectionTitle = '';

  if (metric.id === 'total-items-geral') {
    itemsToDisplay = metric.allItemsDetails;
    itemsSectionTitle = 'Todos os Itens:';
  } else if (metric.id === 'operacoes-pendentes') {
    itemsToDisplay = metric.pendingItemsDetails;
    itemsSectionTitle = 'Itens Pendentes:';
  } else if (metric.id === 'operacoes-em-transito') {
    itemsToDisplay = metric.inTransitItemsDetails;
    itemsSectionTitle = 'Itens Em Trânsito:';
  } else if (metric.id === 'operacoes-concluidas') {
    itemsToDisplay = metric.completedItemsDetails;
    itemsSectionTitle = 'Itens Concluídos:';
  }

  const showItemsSection = itemsToDisplay && itemsToDisplay.length > 0;

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!itemsToDisplay || itemsToDisplay.length === 0) {
      toast({ title: "Nenhum item para exportar", description: "Não há dados de itens para gerar o relatório.", variant: "default" });
      return;
    }

    setIsExporting(true);
    try {
      await generateItemsReport(itemsToDisplay, format, metric.title);
      toast({ title: "Exportação Concluída", description: `O relatório de itens foi exportado com sucesso para ${format.toUpperCase()}.` });
    } catch (error: any) {
      console.error("Erro ao exportar relatório de itens:", error);
      toast({ title: "Erro na Exportação", description: error.message || "Ocorreu um erro ao gerar o relatório.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={cn("h-6 w-6", metric.color)} />}
            <DialogTitle className="gradient-text">
              Detalhes: {metric.title}
            </DialogTitle>
          </div>
          {showItemsSection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
                  <FileText className="mr-2 h-4 w-4" /> Exportar para PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar para CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </DialogHeader>
        <DialogDescription>
          Informações detalhadas sobre a métrica "{metric.title}".
        </DialogDescription>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-foreground">Valor Principal:</p>
            <span className="text-2xl font-bold font-orbitron gradient-text">{metric.value}</span>
          </div>

          {metric.description && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Descrição:</p>
              <p className="text-foreground">{metric.description}</p>
            </div>
          )}

          {metric.id === 'total-operacoes' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Distribuição:</p>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-foreground">{metric.coletasCount} Coletas</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-accent" />
                <span className="text-foreground">{metric.entregasCount} Entregas</span>
              </div>
            </div>
          )}

          {(metric.id === 'operacoes-em-transito' || metric.id === 'operacoes-pendentes' || metric.id === 'operacoes-concluidas') && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Distribuição:</p>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-foreground">{metric.coletasCount} Coletas {metric.title.toLowerCase().replace('operações ', '')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-accent" />
                <span className="text-foreground">{metric.entregasCount} Entregas {metric.title.toLowerCase().replace('operações ', '')}</span>
              </div>
            </div>
          )}

          {showItemsSection && (
            <div className="space-y-2 border-t border-border/50 pt-4">
              <p className="text-sm font-semibold text-muted-foreground">
                {itemsSectionTitle}
              </p>
              <div className="h-48 border rounded-md overflow-auto">
                <Table className="min-w-full">
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-[50px]">Qtd</TableHead>
                      <TableHead className="min-w-[150px]">Item</TableHead>
                      <TableHead className="min-w-[200px]">Descrição</TableHead>
                      <TableHead className="w-[80px] text-right">Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsToDisplay?.map((item, itemIndex) => (
                      <TableRow key={itemIndex}>
                        <TableCell className="font-medium">{item.quantity}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.description}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className={cn(
                            "px-1 py-0.5 text-[0.6rem]",
                            item.type === 'coleta' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                          )}>
                            {item.type === 'coleta' ? 'Coleta' : 'Entrega'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};