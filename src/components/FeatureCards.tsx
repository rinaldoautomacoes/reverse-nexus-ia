import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Zap, TrendingUp, Package, Truck, Route, ShieldCheck, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, delay }) => (
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
    <CardContent>
      <p className="text-lg font-bold font-orbitron gradient-text">{description}</p>
    </CardContent>
  </Card>
);

export const FeatureCards: React.FC = () => {
  const features = [
    {
      title: 'Robôs IA',
      description: 'Automação inteligente para otimizar processos.',
      icon: Brain,
      delay: 0,
    },
    {
      title: 'Eficiência Operacional',
      description: 'Reduza custos e tempo com gestão 360.',
      icon: Zap,
      delay: 100,
    },
    {
      title: 'Insights Preditivos',
      description: 'Decisões estratégicas baseadas em dados.',
      icon: Lightbulb,
      delay: 200,
    },
    {
      title: 'Otimização de Rotas',
      description: 'Planejamento inteligente para entregas rápidas.',
      icon: Route,
      delay: 300,
    },
    {
      title: 'Segurança de Dados',
      description: 'Proteção avançada para suas informações.',
      icon: ShieldCheck,
      delay: 400,
    },
    {
      title: 'Gestão de Estoque',
      description: 'Controle total e visibilidade em tempo real.',
      icon: Package,
      delay: 500,
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
              description={feature.description}
              icon={feature.icon}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};