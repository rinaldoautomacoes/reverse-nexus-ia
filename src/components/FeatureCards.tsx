import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Lightbulb, FileText, Package, Truck } from 'lucide-react'; // Adicionado FileText, Package, Truck
import { cn } from '@/lib/utils';
// import { useNavigate } from 'react-router-dom'; // Removido useNavigate, pois os cards não serão mais clicáveis

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  delay: number;
  // path: string; // Removido path, pois os cards não serão mais clicáveis
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, delay /*, path*/ }) => {
  // const navigate = useNavigate(); // Removido useNavigate
  return (
    <Card 
      className="card-futuristic border-0 bg-gradient-dark animate-slide-up transition-all duration-300 ease-in-out" // Removido cursor-pointer e hover:scale
      style={{ animationDelay: `${delay}ms` }}
      // onClick={() => navigate(path)} // Removido onClick
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
};

export const FeatureCards: React.FC = () => {
  const features = [
    {
      title: 'Relatório de Coletas',
      description: 'Análises e insights sobre suas coletas.',
      icon: FileText,
      // path: '/relatorios', // Removido path
      delay: 0,
    },
    {
      title: 'Relatório de Entregas',
      description: 'Análises e insights sobre suas entregas.',
      icon: Truck, // Usando Truck para diferenciar de coletas
      // path: '/relatorios-entregas', // Removido path
      delay: 100,
    },
    {
      title: 'Status dos Produtos',
      description: 'Visão geral do status dos produtos em coletas.',
      icon: Package,
      // path: '/coletas-dashboard', // Removido path
      delay: 200,
    },
  ];

  return (
    <section className="px-6 lg:px-8 py-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold font-orbitron gradient-text text-center mb-10 animate-slide-up">
          Transforme Sua Logística
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Alterado para 3 colunas */}
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              delay={feature.delay}
              // path={feature.path} // Não passa mais o path
            />
          ))}
        </div>
      </div>
    </section>
  );
};