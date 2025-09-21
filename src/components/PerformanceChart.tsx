import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, PieChart } from "lucide-react";

export const PerformanceChart = () => {
  const chartData = [
    { month: "Jan", collections: 1200, processed: 1150, efficiency: 95.8 },
    { month: "Fev", collections: 1350, processed: 1280, efficiency: 94.8 },
    { month: "Mar", collections: 1500, processed: 1445, efficiency: 96.3 },
    { month: "Abr", collections: 1680, processed: 1620, efficiency: 96.4 },
    { month: "Mai", collections: 1850, processed: 1790, efficiency: 96.8 },
    { month: "Jun", collections: 2100, processed: 2050, efficiency: 97.6 }
  ];

  const maxCollections = Math.max(...chartData.map(d => d.collections));

  return (
    <Card className="card-futuristic border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-orbitron gradient-text">
              Performance do Sistema
            </CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <TrendingUp className="w-3 h-3 mr-1" />
              +24%
            </Badge>
            <Badge variant="secondary" className="bg-neural/20 text-neural">
              97.6% Eficiência
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart Visualization */}
          <div className="h-64 relative">
            <div className="absolute inset-0 bg-gradient-dark rounded-lg border border-border/50 p-4">
              {/* Chart Grid */}
              <div className="h-full relative">
                {/* Grid Lines */}
                <div className="absolute inset-0">
                  {[0, 25, 50, 75, 100].map((percentage) => (
                    <div 
                      key={percentage}
                      className="absolute w-full border-t border-border/20"
                      style={{ top: `${100 - percentage}%` }}
                    />
                  ))}
                </div>
                
                {/* Chart Bars */}
                <div className="h-full flex items-end justify-between gap-2 relative z-10">
                  {chartData.map((data, index) => {
                    const height = (data.collections / maxCollections) * 100;
                    const processedHeight = (data.processed / maxCollections) * 100;
                    
                    return (
                      <div key={data.month} className="flex-1 flex flex-col items-center">
                        {/* Bar Container */}
                        <div className="relative w-full mb-2" style={{ height: '180px' }}>
                          {/* Collections Bar */}
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-primary rounded-t-md animate-slide-up"
                            style={{ 
                              height: `${height}%`,
                              animationDelay: `${index * 200}ms`
                            }}
                          />
                          {/* Processed Bar */}
                          <div 
                            className="absolute bottom-0 w-full bg-accent/80 rounded-t-md animate-slide-up"
                            style={{ 
                              height: `${processedHeight}%`,
                              animationDelay: `${index * 200 + 100}ms`
                            }}
                          />
                          
                          {/* Efficiency Indicator */}
                          <div 
                            className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs"
                            style={{ animationDelay: `${index * 200 + 300}ms` }}
                          >
                            <span className="text-neural font-medium">
                              {data.efficiency}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Month Label */}
                        <span className="text-xs text-muted-foreground font-medium">
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Legend and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-gradient-primary rounded" />
              <div>
                <p className="text-sm font-medium">Coletas Totais</p>
                <p className="text-xs text-muted-foreground">Agendadas + Realizadas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-accent rounded" />
              <div>
                <p className="text-sm font-medium">Processadas</p>
                <p className="text-xs text-muted-foreground">Finalizadas com sucesso</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <div className="w-4 h-4 bg-neural rounded" />
              <div>
                <p className="text-sm font-medium">Eficiência IA</p>
                <p className="text-xs text-muted-foreground">Taxa de otimização</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};