import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Package,
  Truck,
  ListChecks,
  CheckCircle,
  FileText,
  CalendarPlus,
  Brain,
  User as UserIcon,
  Users,
  Rocket,
  Globe,
  Zap,
  Route,
} from 'lucide-react';
import heroLogisticsFuturistic from "@/assets/hero-logistics-futuristic.png"; // Nova imagem de fundo
import { useAuth } from '@/hooks/useAuth';
import { FeatureCards } from '@/components/FeatureCards';
import { VideoCarousel } from '@/components/VideoCarousel'; // Importar o novo componente

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const userName = profile?.first_name || 'Usuário';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section - Upper Card */}
      <div
        className="relative h-[70vh] bg-cover bg-center bg-no-repeat flex flex-col justify-start p-6 animate-background-pan" // Adicionado animate-background-pan
        style={{ backgroundImage: `url(${heroLogisticsFuturistic})` }}
      >
        {/* Darker overlay for better text readability - adjusted opacity */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-darker/40 via-slate-darker/60 to-slate-darker/75" /> {/* Opacidade ajustada */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-darker/30 via-transparent to-slate-darker/30" /> {/* Opacidade ajustada */}
        
        {/* Glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow animation-delay-200" />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-neural/10 rounded-full blur-3xl animate-pulse-glow animation-delay-400 -translate-x-1/2 -translate-y-1/2" /> {/* Novo glow effect */}
        </div>

        <div className="relative z-10 flex flex-col justify-start pt-6 px-6 lg:px-8">
          {/* Main title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-orbitron gradient-text mb-4 animate-slide-up">
            Plataforma Logística 360
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground/90 mb-8 animate-slide-up animation-delay-200">
            Plataforma Inteligente de Logística
          </p>
          
          {/* Routing Button */}
          {/* Removido o botão de roteirização daqui */}
        </div>
      </div>

      {/* Feature Cards Section */}
      <FeatureCards />

      {/* Video Carousel Section */}
      {/* <section className="px-6 lg:px-8 py-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-orbitron gradient-text text-center mb-10 animate-slide-up">
            Explore Nossos Recursos
          </h2>
          <VideoCarousel />
        </div>
      </section> */}
    </div>
  );
};