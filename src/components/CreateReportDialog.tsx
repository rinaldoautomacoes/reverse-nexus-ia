import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // Mantido caso a geração de PDF precise de HTML
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { ReportForm } from "./ReportForm"; // Importar o novo ReportForm

type ReportInsert = TablesInsert<'reports'>;

export const CreateReportDialog = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addReportMutation = useMutation({
    mutationFn: async (newReport: ReportInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para criar relatórios.");
      }
      const { data, error } = await supabase
        .from('reports')
        .insert({ ...newReport, user_id: user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ['reports', user?.id] });
      toast({
        title: "Relatório Criado!",
        description: `${newReport.title} foi gerado com sucesso.`,
      });
      setOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Erro",
        description: err.message || "Falha ao gerar o relatório. Tente novamente.",
        variant: "destructive"
      });
    },
  });

  const handleSaveReport = (data: ReportInsert | TablesInsert<'reports'>) => {
    addReportMutation.mutate(data as ReportInsert);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect"
        >
          <FileText className="mr-2 h-4 w-4" />
          Novo Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <FileText className="h-5 w-5" />
            Criar Novo Relatório
          </DialogTitle>
        </DialogHeader>
        
        <ReportForm 
          onSave={handleSaveReport} 
          onCancel={() => setOpen(false)} 
          isPending={addReportMutation.isPending} 
        />
      </DialogContent>
    </Dialog>
  );
};

// A função generateReportPDF permanece a mesma, pois é uma utilidade de PDF
export const generateReportPDF = async (reportData: any) => {
  try {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(0, 245, 255); // Primary color
    pdf.text('LogiReverseIA - Relatório', 20, 30);
    
    // Report title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(reportData.title, 20, 50); // Usar reportData.title
    
    // Report info
    pdf.setFontSize(12);
    pdf.text(`Período: ${reportData.period}`, 20, 70); // Usar reportData.period
    pdf.text(`Tipo: ${reportData.type}`, 20, 80); // Usar reportData.type
    pdf.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 90);
    
    // Description
    if (reportData.description) { // Usar reportData.description
      pdf.text('Descrição:', 20, 110);
      const splitText = pdf.splitTextToSize(reportData.description, 170);
      pdf.text(splitText, 20, 120);
    }
    
    // Metrics section (these are hardcoded for PDF generation, not dynamic from DB)
    pdf.setFontSize(14);
    pdf.text('Métricas Principais:', 20, 160);
    
    const metricas = [
      { titulo: "Total Coletado", valor: "2.847 itens", variacao: "+12%" },
      { titulo: "Eficiência IA", valor: "94.2%", variacao: "+8%" },
      { titulo: "Economia Combustível", valor: "R$ 3.240", variacao: "+22%" },
      { titulo: "Tempo Médio", valor: "2.4h por rota", variacao: "-15%" }
    ];
    
    let yPosition = 180;
    pdf.setFontSize(10);
    
    metricas.forEach((metrica) => {
      pdf.text(`${metrica.titulo}: ${metrica.valor} (${metrica.variacao})`, 20, yPosition);
      yPosition += 10;
    });
    
    // Analysis section
    pdf.setFontSize(14);
    pdf.text('Análise IA:', 20, 230);
    
    pdf.setFontSize(10);
    const analise = [
      '• Rotas otimizadas resultaram em 22% de economia de combustível',
      '• Algoritmo de IA identificou padrões de eficiência em horários específicos',
      '• Recomendação: Implementar coletas matinais para máxima eficiência',
      '• Previsão de crescimento: +15% na próxima temporada'
    ];
    
    yPosition = 250;
    analise.forEach((item) => {
      pdf.text(item, 20, yPosition);
      yPosition += 8;
    });
    
    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Gerado automaticamente por LogiReverseIA', 20, 280);
    pdf.text(`ID do Relatório: LR-${reportData.id || Date.now()}`, 20, 285);
    
    // Save the PDF
    const fileName = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};