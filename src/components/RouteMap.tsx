import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, Zap } from "lucide-react";
import { InteractiveMap } from "./InteractiveMap";

export const RouteMap = () => {
  const routes = [
    { 
      id: 1, 
      name: "Zona Norte", 
      stops: 12, 
      status: "ativa" as const, 
      eta: "14:30",
      coordinates: [
        [-43.2075, -22.9035], // Rio center
        [-43.1800, -22.8900], // Tijuca
        [-43.1500, -22.8700], // Maracanã
        [-43.1200, -22.8500]  // Zona Norte
      ] as [number, number][],
      color: '#00f5ff'
    },
    { 
      id: 2, 
      name: "Centro", 
      stops: 8, 
      status: "otimizando" as const, 
      eta: "15:45",
      coordinates: [
        [-43.2075, -22.9035], // Rio center
        [-43.1900, -22.9100], // Downtown
        [-43.1750, -22.9200], // Historic center
        [-43.1650, -22.9150]  // Business district
      ] as [number, number][],
      color: '#7c3aed'
    },
    { 
      id: 3, 
      name: "Zona Sul", 
      stops: 15, 
      status: "pendente" as const, 
      eta: "16:20",
      coordinates: [
        [-43.2075, -22.9035], // Rio center
        [-43.1900, -22.9300], // Copacabana direction
        [-43.1700, -22.9500], // Ipanema
        [-43.1500, -22.9700]  // Barra direction
      ] as [number, number][],
      color: '#10b981'
    }
  ];

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-orbitron gradient-text">
            Rotas Inteligentes
          </CardTitle>
          <Button size="sm" className="glow-effect">
            <Zap className="w-4 h-4 mr-2" />
            Otimizar IA
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <InteractiveMap routes={routes} height="h-64" showTokenInput={true} />
      </CardContent>
    </Card>
  );
};