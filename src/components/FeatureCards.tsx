import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Lightbulb } from 'lucide-react'; // Mantendo alguns ícones para o placeholder
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  delay: number;
}

// O componente FeatureCard individual não será mais usado diretamente, mas mantido para referência
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
  // As features foram removidas para deixar o card vazio
  // const features = [...]; 

  return (
    <section className="px-6 lg:px-8 py-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold font-orbitron gradient-text text-center mb-10 animate-slide-up">
          Transforme Sua Logística
        </h2>
        <div className="grid grid-cols-1"> {/* Alterado para uma única coluna */}
          <Card className="card-futuristic border-0 bg-gradient-dark h-48 flex items-center justify-center text-center">
            <CardContent className="p-6">
              <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-float" />
              <p className="text-lg font-semibold text-muted-foreground">
                Conteúdo futuro para esta seção.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Novas funcionalidades e insights em breve!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};