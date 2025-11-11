import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit, Trash2, Package, Clock, User, Phone, Mail, MapPin, Hash, Calendar as CalendarIcon, Building, MessageSquare, Send, DollarSign, Tag, Home, Flag, ClipboardList, FileText, Paperclip, Loader2
} from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types_generated";

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

interface ColetaCardProps {
  coleta: Coleta;
  index: number;
  onEdit: (coleta: Coleta) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, name: string, status: string) => void;
  onUpdateResponsible: (id: string, name: string, responsible_user_id: string | null) => void;
  onWhatsAppClick: (coleta: Coleta) => void;
  onEmailClick: (coleta: Coleta) => void;
  isDeleting: boolean;
}

export const ColetaCard: React.FC<ColetaCardProps> = ({
  coleta,
  index,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateResponsible,
  onWhatsAppClick,
  onEmailClick,
  isDeleting,
}) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-destructive/20 text-destructive';
      case 'agendada':
        return 'bg-warning-yellow/20 text-warning-yellow';
      case 'concluida':
        return 'bg-success-green/20 text-success-green';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'agendada':
        return 'Em Trânsito';
      case 'concluida':
        return 'Concluída';
      default:
        return status;
    }
  };

  return (
    <div
      key={coleta.id}
      className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex-1 min-w-0 mb-3 lg:mb-0">
        <h3 className="font-semibold text-lg">{coleta.parceiro}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Tag className="h-3 w-3" /> {coleta.unique_number}
          {coleta.client_control && (
            <span className="ml-2 flex items-center gap-1">
              <ClipboardList className="h-3 w-3" /> {coleta.client_control}
            </span>
          )}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
          {coleta.endereco_origem && (
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" /> Origem: {coleta.endereco_origem}
            </div>
          )}
          {coleta.endereco_destino && (
            <div className="flex items-center gap-1">
              <Flag className="h-3 w-3" /> Destino: {coleta.endereco_destino}
            </div>
          )}
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" /> Previsão: {coleta.previsao_coleta ? (isValid(new Date(coleta.previsao_coleta)) ? format(new Date(coleta.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida') : 'N/A'}
          </div>
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3" /> Qtd Total: {getTotalQuantityOfItems(coleta.items)}
          </div>
          <div className="flex items-center gap-1 col-span-full">
            <Package className="h-3 w-3" /> Materiais: {formatItemsForColetaModeloAparelho(coleta.items)}
          </div>
          {coleta.contrato && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> Nr. Contrato: {coleta.contrato}
            </div>
          )}
          {coleta.nf_glbl && (
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" /> CONTRATO SANKHYA: {coleta.nf_glbl}
            </div>
          )}
          {coleta.partner_code && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" /> CÓD. PARC: {coleta.partner_code}
            </div>
          )}
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" /> Responsável: {coleta.responsavel || 'Não atribuído'}
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3" /> Motorista: {coleta.driver?.name || 'Não atribuído'}
          </div>
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3" /> Transportadora: {coleta.transportadora?.name || 'Não atribuída'}
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Frete: {coleta.freight_value ? `R$ ${coleta.freight_value.toFixed(2)}` : 'N/A'}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Status: <Badge className={getStatusBadgeColor(coleta.status_coleta)}>{getStatusText(coleta.status_coleta)}</Badge>
          </div>
          {coleta.attachments && coleta.attachments.length > 0 && (
            <div className="flex items-center gap-1 col-span-full">
              <Paperclip className="h-3 w-3" /> Anexos: {coleta.attachments.length}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-accent text-accent hover:bg-accent/10"
          onClick={() => onEdit(coleta)}
        >
          <Edit className="mr-1 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-success-green text-success-green hover:bg-success-green/10"
          onClick={() => onWhatsAppClick(coleta)}
          disabled={!coleta.telefone}
        >
          <MessageSquare className="mr-1 h-3 w-3" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-neural text-neural hover:bg-neural/10"
          onClick={() => onEmailClick(coleta)}
          disabled={!coleta.email}
        >
          <Send className="mr-1 h-3 w-3" />
          E-mail
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-accent text-accent hover:bg-accent/10"
          onClick={() => onUpdateStatus(coleta.id, coleta.parceiro || 'Coleta', coleta.status_coleta)}
        >
          <Edit className="mr-1 h-3 w-3" />
          Status
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={() => onUpdateResponsible(coleta.id, coleta.parceiro || 'Coleta', coleta.responsible_user_id)}
        >
          <User className="mr-1 h-3 w-3" />
          Responsável
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(coleta.id)}
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