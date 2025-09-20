import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Route, MapPin, Clock, Zap, Brain, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InteractiveMap } from "@/components/InteractiveMap";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const RotaInteligente = () => {
  const navigate = useNavigate();
  const [rotasState, setRotasState] = useState([
    {
      id: 1,
      nome: "Rota Centro",
      pontos: 8,
      distancia: "45.2 km",
      tempo: "3h 20min",
      status: "otimizada",
      economia: "22%"
    },
    {
      id: 2,
      nome: "Rota Norte",
      pontos: 12,
      distancia: "62.8 km", 
      tempo: "4h 15min",
      status: "processando",
      economia: "18%"
    },
    {
      id: 3,
      nome: "Rota Sul",
      pontos: 6,
      distancia: "28.5 km",
      tempo: "2h 10min", 
      status: "agendada",
      economia: "31%"
    }
  ]);

  const iniciarRota = (rotaId: number) => {
    setRotasState(rotas => 
      rotas.map(rota => 
        rota.id === rotaId 
          ? { ...rota, status: "ativa" as const }
          : rota
      )
    );
    
    const rota = rotasState.find(r => r.id === rotaId);
    toast({
      title: "Rota Iniciada!",
      description: `${rota?.nome} foi iniciada com sucesso. Tempo estimado: ${rota?.tempo}`,
    });
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
              Rota Inteligente
            </h1>
            <p className="text-muted-foreground">
              IA otimizando rotas em tempo real para máxima eficiência
            </p>
          </div>

          {/* Status IA */}
          <Card className="card-futuristic">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse-glow" />
                  <span className="font-medium">IA Neural Ativa</span>
                  <Badge className="bg-neural/20 text-neural">
                    <Brain className="w-3 h-3 mr-1" />
                    Otimizando
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Economia média: 24% | Tempo reduzido: 1h 30min
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mapa Principal */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                Mapa de Rotas Otimizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveMap 
                routes={rotasState.map(rota => ({
                  id: rota.id,
                  name: rota.nome,
                  stops: rota.pontos,
                  status: rota.status as 'ativa' | 'otimizando' | 'pendente',
                  eta: rota.tempo,
                  coordinates: [
                    [-43.2075, -22.9035], // Rio center - base point
                    [-43.2075 + (rota.id - 1) * 0.05, -22.9035 + (rota.id - 1) * 0.03],
                    [-43.2075 + (rota.id - 1) * 0.1, -22.9035 + (rota.id - 1) * 0.06],
                    [-43.2075 + (rota.id - 1) * 0.15, -22.9035 + (rota.id - 1) * 0.09]
                  ] as [number, number][],
                  color: rota.id === 1 ? '#00f5ff' : rota.id === 2 ? '#7c3aed' : '#10b981'
                }))}
                height="h-96" 
                showTokenInput={true} 
              />
            </CardContent>
          </Card>

          {/* Lista de Rotas */}
          <div className="grid gap-4">
            <h2 className="text-2xl font-semibold">Rotas Disponíveis</h2>
            {rotasState.map((rota) => (
              <Card key={rota.id} className="card-futuristic">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-lg">{rota.nome}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {rota.pontos} pontos
                          </span>
                          <span>{rota.distancia}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rota.tempo}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge 
                          variant={rota.status === 'otimizada' || rota.status === 'ativa' ? 'default' : 'secondary'}
                          className={rota.status === 'otimizada' || rota.status === 'ativa' ? 'bg-primary/20 text-primary' : ''}
                        >
                          {rota.status}
                        </Badge>
                        <p className="text-sm text-accent mt-1">
                          Economia: {rota.economia}
                        </p>
                      </div>
                      
                      <Button 
                        className="bg-gradient-secondary hover:bg-gradient-secondary/80 hover-scale"
                        disabled={rota.status === 'processando' || rota.status === 'ativa'}
                        onClick={() => iniciarRota(rota.id)}
                      >
                        <Route className="mr-2 h-4 w-4" />
                        {rota.status === 'processando' ? 'Processando...' : 
                         rota.status === 'ativa' ? 'Rota Ativa' : 'Iniciar Rota'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <Button className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80 glow-effect">
              <Zap className="mr-2 h-4 w-4" />
              Nova Otimização IA
            </Button>
            <Button variant="outline" className="border-neural text-neural hover:bg-neural/10">
              <Brain className="mr-2 h-4 w-4" />
              Configurações IA
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};