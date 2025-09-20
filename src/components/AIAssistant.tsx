import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  MessageCircle, 
  Send, 
  Lightbulb,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

export const AIAssistant = () => {
  const suggestions = [
    {
      type: "insight",
      icon: Lightbulb,
      title: "Otimização Detectada",
      message: "Rota Zona Norte pode ser 15% mais eficiente",
      priority: "high"
    },
    {
      type: "trend",
      icon: TrendingUp,
      title: "Tendência Positiva",
      message: "Coletas aumentaram 23% esta semana",
      priority: "medium"
    },
    {
      type: "alert",
      icon: AlertTriangle,
      title: "Atenção Necessária",
      message: "3 coletas pendentes há mais de 48h",
      priority: "urgent"
    }
  ];

  const quickActions = [
    "Otimizar todas as rotas",
    "Relatório semanal",
    "Previsão de demanda",
    "Status dos veículos"
  ];

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center animate-pulse-glow">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg font-orbitron gradient-text">
              Assistente IA
            </CardTitle>
            <p className="text-sm text-muted-foreground">LogiReverse Neural</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Suggestions */}
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <div 
                key={index} 
                className="p-3 bg-secondary/20 rounded-lg border border-border/30 animate-slide-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${suggestion.priority === 'urgent' ? 'bg-destructive/20' : 
                      suggestion.priority === 'high' ? 'bg-neural/20' : 
                      'bg-primary/20'}
                  `}>
                    <Icon className={`
                      w-4 h-4 
                      ${suggestion.priority === 'urgent' ? 'text-destructive' : 
                        suggestion.priority === 'high' ? 'text-neural' : 
                        'text-primary'}
                    `} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{suggestion.title}</p>
                      <Badge 
                        variant="secondary" 
                        className={`
                          text-xs
                          ${suggestion.priority === 'urgent' ? 'bg-destructive/20 text-destructive' : 
                            suggestion.priority === 'high' ? 'bg-neural/20 text-neural' : 
                            'bg-primary/20 text-primary'}
                        `}
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-sm font-medium mb-3">Ações Rápidas</p>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto p-2 hover:bg-primary/10 hover:text-primary"
              >
                <MessageCircle className="w-3 h-3 mr-2 opacity-50" />
                {action}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="border-t border-border/30 pt-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Pergunte ao assistente IA..."
              className="bg-secondary/20 border-border/30 focus:border-primary"
            />
            <Button size="sm" className="glow-effect">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};