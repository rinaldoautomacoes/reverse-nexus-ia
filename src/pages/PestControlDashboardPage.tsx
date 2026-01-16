"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bug, PlusCircle } from 'lucide-react';
import heroBackground from "@/assets/hero-ai-logistics-dashboard.png"; // Reusing a generic dashboard hero image
import { useAuth } from '@/hooks/use-auth';
import { PestControlMetricsCards } from '@/components/pest-control-dashboard/PestControlMetricsCards';
import { PestControlStatusChart } from '@/components/pest-control-dashboard/PestControlStatusChart';
import { PestControlStatusDonutChart } from '@/components/pest-control-dashboard/PestControlStatusDonutChart';

interface PestControlDashboardPageProps {
  selectedYear: string;
}

export const PestControlDashboardPage: React.FC<PestControlDashboardPageProps> = ({ selectedYear }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background ai-pattern">
      {/* Hero Section */}
      <div
        className="relative h-96 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-darker/90 to-transparent" />

        <div className="relative z-10 flex flex-col justify-start pt-12 h-full px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-5xl lg:text-7xl font-bold font-orbitron gradient-text mb-4 animate-slide-up">
              Dashboard Controle de Pragas
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 animate-slide-up animation-delay-200">
              Visão geral e gestão de serviços de dedetização
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 lg:px-8 py-8 space-y-8">
        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={() => navigate('/pest-control')}
            className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </div>

        {/* Metrics Cards */}
        <PestControlMetricsCards selectedYear={selectedYear} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            <PestControlStatusChart selectedYear={selectedYear} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <PestControlStatusDonutChart selectedYear={selectedYear} />
          </div>
        </div>
      </div>
    </div>
  );
};