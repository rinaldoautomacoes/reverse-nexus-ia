import { EntregasConcluidasDashboard } from "@/components/EntregasConcluidasDashboard";
import React from "react";

interface EntregasConcluidasPageProps {
  selectedYear: string;
}

export const EntregasConcluidasPage: React.FC<EntregasConcluidasPageProps> = ({ selectedYear }) => {
  return <EntregasConcluidasDashboard selectedYear={selectedYear} />;
};