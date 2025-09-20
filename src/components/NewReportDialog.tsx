import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, FileText, Zap, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface NewReportDialogProps {
  onReportCreated: (report: any) => void;
}

export const NewReportDialog = ({ onReportCreated }: NewReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    periodo: "",
    tipo: "",
    formato: "PDF",
    descricao: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newReport = {
        titulo: formData.titulo,
        periodo: formData.periodo,
        tipo: formData.tipo,
        status: "Pronto",
        formato: formData.formato,
        id: Date.now(),
        descricao: formData.descricao,
        createdAt: new Date().toISOString()
      };

      onReportCreated(newReport);
      
      toast({
        title: "Relatório Criado!",
        description: `${formData.titulo} foi gerado com sucesso.`,
      });

      // Reset form
      setFormData({
        titulo: "",
        periodo: "",
        tipo: "",
        formato: "PDF",
        descricao: ""
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect"
          onClick={() => console.log('Novo relatório clicked')}
        >
          <Calendar className="mr-2 h-4 w-4" />
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Relatório</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              placeholder="Ex: Relatório Mensal de Performance"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodo">Período</Label>
              <Input
                id="periodo"
                value={formData.periodo}
                onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                placeholder="Ex: Janeiro 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => setFormData({...formData, tipo: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completo">Completo</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="IA Insights">IA Insights</SelectItem>
                  <SelectItem value="Performance">Performance</SelectItem>
                  <SelectItem value="Eficiência">Eficiência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formato">Formato</Label>
            <Select 
              value={formData.formato} 
              onValueChange={(value) => setFormData({...formData, formato: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="Excel">Excel</SelectItem>
                <SelectItem value="Word">Word</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Descrição detalhada do relatório..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface PDFGeneratorProps {
  reportData: any;
  onComplete?: () => void;
}

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
    pdf.text(reportData.titulo, 20, 50);
    
    // Report info
    pdf.setFontSize(12);
    pdf.text(`Período: ${reportData.periodo}`, 20, 70);
    pdf.text(`Tipo: ${reportData.tipo}`, 20, 80);
    pdf.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 90);
    
    // Description
    if (reportData.descricao) {
      pdf.text('Descrição:', 20, 110);
      const splitText = pdf.splitTextToSize(reportData.descricao, 170);
      pdf.text(splitText, 20, 120);
    }
    
    // Metrics section
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
    const fileName = `${reportData.titulo.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};