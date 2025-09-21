import { Dashboard } from "@/components/Dashboard";

interface IndexProps {
  selectedYear: string;
}

const Index: React.FC<IndexProps> = ({ selectedYear }) => {
  return <Dashboard selectedYear={selectedYear} />;
};

export default Index;