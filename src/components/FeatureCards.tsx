import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Lightbulb, FileText, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollectionReportSummaryCard } from './CollectionReportSummaryCard';
import { DeliveryReportSummaryCard } from './DeliveryReportSummaryCard';
import { ProductStatusSummaryCard } from './ProductStatusSummaryCard';
import { CollectionReportDashboardCard } from './CollectionReportDashboardCard';
import { DeliveryReportDashboardCard } from './DeliveryReportDashboardCard';
import { DeliveryStatusDonutChartCard } from './DeliveryStatusDonutChartCard';
import { CollectionStatusDonutChartCard } from './CollectionStatusDonutChartCard'; // Importar o novo componente

interface FeatureCardProps {
  title: string;
  icon: React.ElementType;
  delay: number;
  children: React.ReactNode; // Agora aceita children para o conteúdo dinâmico
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
      <CardContent className="p-0"> {/* Removido padding padrão para o conteúdo ser controlado pelos filhos */}
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
      title: 'Status Operacionais', // Título atualizado para refletir ambos os gráficos
      icon: Brain, // Ícone genérico para representar "Status Operacionais"
      component: (
        <div className="flex flex-col gap-4"> {/* Usar um div para agrupar os dois gráficos */}
          <DeliveryStatusDonutChartCard />
          <CollectionStatusDonutChartCard />
        </div>
      ),
      delay: 200,
    },
  ];

  return (
    <section className="px-6 lg:px-8 py-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold font-orbitron gradient-text text-center mb-10 animate-slide-up">
          Transforme Sua Logística
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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