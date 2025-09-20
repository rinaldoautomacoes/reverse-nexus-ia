import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  User,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RecentActivity = () => {
  const navigate = useNavigate();
  const activities = [
    {
      id: 1,
      type: "collection",
      icon: Package,
      title: "Coleta Agendada",
      description: "Cliente TechCorp - 50 produtos",
      time: "há 5 min",
      status: "success",
      location: "Zona Norte"
    },
    {
      id: 2,
      type: "route",
      icon: Truck,
      title: "Rota Otimizada",
      description: "IA reduziu distância em 12km",
      time: "há 12 min",
      status: "info",
      location: "Centro"
    },
    {
      id: 3,
      type: "completed",
      icon: CheckCircle,
      title: "Coleta Finalizada",
      description: "EcoSolutions - 120 produtos",
      time: "há 25 min",
      status: "success",
      location: "Zona Sul"
    },
    {
      id: 4,
      type: "pending",
      icon: Clock,
      title: "Aguardando Coleta",
      description: "GreenTech - Prioridade alta",
      time: "há 1h",
      status: "warning",
      location: "Zona Oeste"
    },
    {
      id: 5,
      type: "user",
      icon: User,
      title: "Novo Cliente",
      description: "SustainableCorp cadastrado",
      time: "há 2h",
      status: "info",
      location: "Online"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-primary/20 text-primary';
      case 'warning':
        return 'bg-neural/20 text-neural';
      case 'info':
        return 'bg-accent/20 text-accent';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-primary bg-primary/10';
      case 'warning':
        return 'text-neural bg-neural/10';
      case 'info':
        return 'text-accent bg-accent/10';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <CardTitle className="text-lg font-orbitron gradient-text">
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id}
                className={`flex items-start gap-3 p-3 bg-secondary/10 rounded-lg border border-border/20 animate-slide-up ${
                  activity.type === 'collection' ? 'cursor-pointer hover:bg-secondary/20 transition-colors' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => activity.type === 'collection' && navigate('/coletas')}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getIconColor(activity.status)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(activity.status)}`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.location}
                    </div>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/30">
          <button className="w-full text-sm text-primary hover:text-primary/80 transition-colors">
            Ver todas as atividades →
          </button>
        </div>
      </CardContent>
    </Card>
  );
};