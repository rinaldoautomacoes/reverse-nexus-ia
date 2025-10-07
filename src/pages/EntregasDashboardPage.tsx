import { EntregasAtivasDashboard } from "@/components/EntregasAtivasDashboard";
import React from "react";

interface EntregasDashboardPageProps {
  selectedYear: string;
}

export const EntregasDashboardPage: React.FC<EntregasDashboardPageProps> = ({ selectedYear }) => {
  return <EntregasAtivasDashboard selectedYear={selectedYear} />;
};