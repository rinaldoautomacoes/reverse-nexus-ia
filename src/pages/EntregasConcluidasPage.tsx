import { EntregasConcluidasDashboard } from "@/components/EntregasConcluidasDashboard";
import React from "react";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

interface EntregasConcluidasPageProps {
  selectedYear: string;
}

export const EntregasConcluidasPage: React.FC<EntregasConcluidasPageProps> = ({ selectedYear }) => {
  const { isLoading } = useAuth(); // Use useAuth to ensure user is loaded

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background ai-pattern p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  return <EntregasConcluidasDashboard selectedYear={selectedYear} />;
};