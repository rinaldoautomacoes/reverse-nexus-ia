import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, BarChart3, Download, FileText, Calendar, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NewReportDialog, generateReportPDF } from "@/components/NewReportDialog";
import { useToast } from "@/hooks/use-toast";

export const Relatorios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [relatorios, setRelatorios] = useState([
    {
      id: 1,
      titulo: "Relatório Mensal",
      periodo: "Janeiro 2024",
      tipo: "Completo",
      status: "Pronto",
      formato: "PDF",
      descricao: "Análise completa das operações do mês"
    },
    {
      id: 2,
      titulo: "Análise de Performance",
      periodo: "Últimos 7 dias", 
      tipo: "Operacional",
      status: "Gerando",
      formato: "Excel",
      descricao: "Performance operacional semanal"
    },
    {
      id: 3,
      titulo: "Eficiência de Rotas",
      periodo: "Dezembro 2023",
      tipo: "IA Insights",
      status: "Pronto", 
      formato: "PDF",
      descricao: "Análise de eficiência com insights de IA"
    }
  ]);

  const metricas = [
    { titulo: "Total Coletado", valor: "2.847", unidade: "itens", variacao: "+12%" },
    { titulo: "Eficiência IA", valor: "94.2%", unidade: "", variacao: "+8%" },
    { titulo: "Economia Combustível", valor: "R$ 3.240", unidade: "", variacao: "+22%" },
    { titulo: "Tempo Médio", valor: "2.4h", unidade: "por rota", variacao: "-15%" }
  ];

  const handleNewReport = (newReport: any) => {
    setRelatorios(prev => [newReport, ...prev]);
  };

  const handleDownload = async (relatorio: any) => {
    if (relatorio.status !== 'Pronto') return;

    try {
      await generateReportPDF(relatorio);
      toast({
        title: "Download Concluído!",
        description: `${relatorio.titulo} foi baixado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro no Download",
        description: "Falha ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
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
              Relatórios
            </h1>
            <p className="text-muted-foreground">
              Análises inteligentes e insights automatizados
            </p>
          </div>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricas.map((metrica, index) => (
              <Card key={index} className="card-futuristic">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{metrica.titulo}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold">{metrica.valor}</p>
                        <p className="text-xs text-muted-foreground">{metrica.unidade}</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={metrica.variacao.startsWith('+') ? 'text-accent' : 'text-neural'}
                      >
                        {metrica.variacao}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico Principal */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-slate-darker/20 rounded-lg border border-primary/20 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto" />
                  <p className="text-muted-foreground">Gráfico de performance detalhado</p>
                  <p className="text-sm text-muted-foreground">Dados em tempo real com IA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Relatórios */}
          <Card className="card-futuristic">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Relatórios Disponíveis
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-accent text-accent">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                  <NewReportDialog onReportCreated={handleNewReport} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatorios.map((relatorio, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{relatorio.titulo}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{relatorio.periodo}</span>
                      <Badge variant="secondary" className="text-xs">
                        {relatorio.tipo}
                      </Badge>
                      <span>{relatorio.formato}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={relatorio.status === 'Pronto' ? 'default' : 'secondary'}
                      className={relatorio.status === 'Pronto' ? 'bg-primary/20 text-primary' : ''}
                    >
                      {relatorio.status}
                    </Badge>
                    <Button 
                      size="sm" 
                      disabled={relatorio.status !== 'Pronto'}
                      className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
                      onClick={() => handleDownload(relatorio)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};