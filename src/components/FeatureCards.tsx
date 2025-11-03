import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, FileText, Package, Truck, Cog, Box, Zap, Route as RouteIcon, Lightbulb } from 'lucide-react'; // 'Robot' substituído por 'Cog'
import { cn } from '@/lib/utils';
import { CollectionReportDashboardCard } from './CollectionReportDashboardCard';
import { DeliveryReportDashboardCard } from './DeliveryReportDashboardCard';
import { DeliveryStatusDonutChartCard } from './DeliveryStatusDonutChartCard';
import { CollectionStatusDonutChartCard } from './CollectionStatusDonutChartCard';

interface FeatureCardProps {
  title: string;
  icon: React.ElementType;
  delay: number;
  children: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, icon: Icon, delay, children }) => {
  return (
    <Card 
      className="card-futuristic border-0 bg-gradient-dark animate-slide-up transition-all duration-300 ease-in-out"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
};

export const FeatureCards: React.FC = () => {
  const features = [
    {
      title: 'Relatório de Coletas',
      icon: FileText,
      component: <CollectionReportDashboardCard />,
      delay: 0,
    },
    {
      title: 'Relatório de Entregas',
      icon: Truck,
      component: <DeliveryReportDashboardCard />,
      delay: 100,
    },
    {
      title: 'Status das Entregas',
      icon: Truck,
      component: <DeliveryStatusDonutChartCard />,
      delay: 200,
    },
    {
      title: 'Status das Coletas',
      icon: Package,
      component: <CollectionStatusDonutChartCard />,
      delay: 300,
    },
    {
      title: 'Otimização de Rotas IA',
      icon: RouteIcon,
      component: (
        <CardContent className="p-4 text-center">
          <Zap className="h-8 w-8 text-accent mx-auto mb-2 animate-pulse-glow" />
          <p className="text-sm text-muted-foreground">Algoritmos avançados para rotas mais eficientes.</p>
        </CardContent>
      ),
      delay: 400,
    },
    {
      title: 'Automação com Robôs',
      icon: Cog, // 'Robot' substituído por 'Cog'
      component: (
        <CardContent className="p-4 text-center">
          <Box className="h-8 w-8 text-neural mx-auto mb-2 animate-float" />
          <p className="text-sm text-muted-foreground">Sistemas inteligentes para gestão e movimentação de caixas.</p>
        </CardContent>
      ),
      delay: 500,
    },
  ];

  return (
    <section className="px-6 lg:px-8 py-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold font-orbitron gradient-text text-center mb-10 animate-slide-up">
          Transforme Sua Logística
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              icon={feature.icon}
              delay={feature.delay}
            >
              {feature.component}
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
};