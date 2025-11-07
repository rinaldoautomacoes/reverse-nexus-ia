import { EntregasAtivasDashboard } from "@/components/EntregasAtivasDashboard";
import React from "react";

interface EntregasAtivasPageProps {
  selectedYear: string;
}

export const EntregasAtivasPage: React.FC<EntregasAtivasPageProps> = ({ selectedYear }) => {
  return <EntregasAtivasDashboard selectedYear={selectedYear} />;
};