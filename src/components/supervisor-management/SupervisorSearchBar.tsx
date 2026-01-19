import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SupervisorSearchBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export const SupervisorSearchBar: React.FC<SupervisorSearchBarProps> = ({ searchTerm, onSearchTermChange }) => {
  return (
    <Card className="card-futuristic">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, sobrenome ou telefone..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};