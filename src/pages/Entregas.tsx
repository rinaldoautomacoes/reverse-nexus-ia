import { EntregasDashboard } from "@/components/EntregasDashboard";

interface EntregasProps {
  selectedYear: string;
}

export const Entregas: React.FC<EntregasProps> = ({ selectedYear }) => {
  return <EntregasDashboard selectedYear={selectedYear} />;
};