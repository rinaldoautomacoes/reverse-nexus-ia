import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Loader2, Tag, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type OutstandingCollectionItem = Tables<'outstanding_collection_items'>;

interface OutstandingItemListItemProps {
  item: OutstandingCollectionItem;
  onEdit: (item: OutstandingCollectionItem) => void; // Reativado
  onDelete: (itemId: string) => void; // Reativado
  isDeleting: boolean; // Reativado
}

export const OutstandingItemListItem: React.FC<OutstandingItemListItemProps> = ({
  item,
  onEdit, // Reativado
  onDelete, // Reativado
  isDeleting, // Reativado
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-destructive/20 text-destructive px-2 py-0.5 text-xs"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case 'coletado':
        return <Badge variant="outline" className="bg-success-green/20 text-success-green px-2 py-0.5 text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Coletado</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-muted/20 text-muted-foreground px-2 py-0.5 text-xs"><XCircle className="h-3 w-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline" className="px-2 py-0.5 text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 rounded-lg border border-primary/10 bg-slate-darker/10">
      <div className="flex-1 min-w-0 mb-2 lg:mb-0">
        <p className="font-semibold text-base flex items-center gap-2 text-primary">
          <Tag className="h-4 w-4 text-primary" />
          {item.product_code}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Descrição: <span className="font-bold text-foreground">{item.product_description || 'N/A'}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Quantidade Pendente: <span className="font-bold text-foreground">{item.quantity_pending}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Status: {getStatusBadge(item.status)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Criado em: {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap justify-end"> {/* Botões de ação reativados */}
        <Button
          variant="outline"
          size="sm"
          className="border-accent text-accent hover:bg-accent/10"
          onClick={() => onEdit(item)}
        >
          <Edit className="mr-1 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="mr-1 h-3 w-3" />
          )}
          Excluir
        </Button>
      </div>
    </div>
  );
};