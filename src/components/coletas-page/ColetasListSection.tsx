import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle } from "lucide-react";
import { ColetaCard } from './ColetaCard';
import type { Tables } from "@/integrations/supabase/types_generated";
import { Loader2 } from 'lucide-react';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

type Coleta = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
  items?: Array<Tables<'items'>> | null;
  attachments?: FileAttachment[] | null;
};

interface ColetasListSectionProps {
  coletas: Coleta[] | undefined;
  isLoading: boolean;
  onAddColetaClick: () => void;
  onEditColeta: (coleta: Coleta) => void;
  onDeleteColeta: (id: string) => void;
  onUpdateStatus: (id: string, name: string, status: string) => void;
  onUpdateResponsible: (id: string, name: string, responsible_user_id: string | null) => void;
  onWhatsAppClick: (coleta: Coleta) => void;
  onEmailClick: (coleta: Coleta) => void;
  isDeletingColeta: boolean;
}

export const ColetasListSection: React.FC<ColetasListSectionProps> = ({
  coletas,
  isLoading,
  onAddColetaClick,
  onEditColeta,
  onDeleteColeta,
  onUpdateStatus,
  onUpdateResponsible,
  onWhatsAppClick,
  onEmailClick,
  isDeletingColeta,
}) => {
  if (isLoading) {
    return (
      <Card className="card-futuristic border-0 animate-pulse">
        <CardHeader>
          <CardTitle className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando coletas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-futuristic">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Minhas Coletas Ativas
        </CardTitle>
        <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80" onClick={onAddColetaClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Coleta
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {coletas && coletas.length > 0 ? (
          coletas.map((coleta, index) => (
            <ColetaCard
              key={coleta.id}
              coleta={coleta}
              index={index}
              onEdit={onEditColeta}
              onDelete={onDeleteColeta}
              onUpdateStatus={onUpdateStatus}
              onUpdateResponsible={onUpdateResponsible}
              onWhatsAppClick={onWhatsAppClick}
              onEmailClick={onEmailClick}
              isDeleting={isDeletingColeta}
            />
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhuma coleta ativa encontrada.</p>
            <p className="text-sm">Agende uma nova coleta para começar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};