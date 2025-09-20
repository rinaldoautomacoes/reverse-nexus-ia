import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Zap, TrendingUp, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const IAInsights = () => {
  const navigate = useNavigate();

  const insights = [
    {
      tipo: "Otimização",
      titulo: "Rota Centro pode ser 23% mais eficiente",
      descricao: "Alterando ordem de paradas e horário de saída",
      impacto: "Alto",
      economia: "R$ 340/mês",
      status: "novo"
    },
    {
      tipo: "Previsão",
      titulo: "Aumento de 15% nas coletas próxima semana",
      descricao: "Baseado em padrões históricos e eventos locais",
      impacto: "Médio", 
      economia: "Preparação",
      status: "ativo"
    },
    {
      tipo: "Alerta",
      titulo: "Veículo V-003 precisa de manutenção",
      descricao: "IA detectou padrões de desgaste nos sensores",
      impacto: "Crítico",
      economia: "Prevenção",
      status: "urgente"
    }
  ];

  const previsoes = [
    { metric: "Volume Coletas", atual: "156", previsto: "179", variacao: "+14.7%" },
    { metric: "Eficiência Rotas", atual: "89.2%", previsto: "94.1%", variacao: "+5.5%" },
    { metric: "Custo por KM", atual: "R$ 2.34", previsto: "R$ 2.08", variacao: "-11.1%" },
    { metric: "Tempo Médio", atual: "3.2h", previsto: "2.8h", variacao: "-12.5%" }
  ];

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
              IA Insights
            </h1>
            <p className="text-muted-foreground">
              Inteligência artificial analisando seus dados em tempo real
            </p>
          </div>

          {/* Status IA */}
          <Card className="card-futuristic">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-neural rounded-full animate-pulse-glow" />
                  <span className="font-medium">IA Neural Processando</span>
                  <Badge className="bg-neural/20 text-neural">
                    <Brain className="w-3 h-3 mr-1" />
                    Deep Learning
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Analisando 2.847 pontos de dados | Última atualização: 2min atrás
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Previsões */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Previsões IA - Próximos 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {previsoes.map((prev, index) => (
                  <div key={index} className="p-4 rounded-lg border border-primary/10 bg-slate-darker/10">
                    <p className="text-sm text-muted-foreground mb-2">{prev.metric}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Atual:</span>
                        <span>{prev.atual}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Previsto:</span>
                        <span className="font-medium">{prev.previsto}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={prev.variacao.startsWith('+') ? 'text-accent' : 'text-neural'}
                      >
                        {prev.variacao}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights Principais */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Insights Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-6 rounded-lg border border-primary/10 bg-slate-darker/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        insight.status === 'urgente' ? 'bg-destructive/20' :
                        insight.status === 'novo' ? 'bg-primary/20' : 'bg-accent/20'
                      }`}>
                        {insight.status === 'urgente' ? 
                          <AlertCircle className="h-4 w-4 text-destructive" /> :
                          insight.status === 'novo' ? 
                          <Zap className="h-4 w-4 text-primary" /> :
                          <CheckCircle className="h-4 w-4 text-accent" />
                        }
                      </div>
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {insight.tipo}
                        </Badge>
                        <h3 className="font-semibold">{insight.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{insight.descricao}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant={insight.impacto === 'Crítico' ? 'destructive' : 'secondary'}
                        className="mb-2"
                      >
                        {insight.impacto}
                      </Badge>
                      <p className="text-sm font-medium text-accent">{insight.economia}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
                      <Zap className="mr-2 h-3 w-3" />
                      Aplicar Sugestão
                    </Button>
                    <Button size="sm" variant="outline" className="border-neural text-neural">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <Button className="flex-1 bg-gradient-secondary hover:bg-gradient-secondary/80 glow-effect">
              <Brain className="mr-2 h-4 w-4" />
              Análise Profunda
            </Button>
            <Button variant="outline" className="border-ai text-ai hover:bg-ai/10">
              <Zap className="mr-2 h-4 w-4" />
              Configurar IA
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};