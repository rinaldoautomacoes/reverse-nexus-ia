import { ColetasDashboard } from "@/components/ColetasDashboard"; // Importar o ColetasDashboard

interface IndexProps {
  selectedYear: string;
}

const Index: React.FC<IndexProps> = ({ selectedYear }) => {
  return <ColetasDashboard selectedYear={selectedYear} />; // Renderizar ColetasDashboard
};

export default Index;