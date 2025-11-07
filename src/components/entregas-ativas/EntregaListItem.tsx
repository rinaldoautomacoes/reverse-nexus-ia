import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit, Trash2, Truck, Clock, Package, CheckCircle, User, Phone, Mail, MapPin, Hash, Calendar as CalendarIcon, Building, MessageSquare, Send, DollarSign, Tag, Home, Flag, ClipboardList, FileText, Paperclip
} from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatItemsForColetaModeloAparelho, getTotalQuantityOfItems } from "@/lib/utils";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Entrega {
  id: string;
  parceiro: string | null;
  unique_number: string | null;
  client_control: string | null;
  endereco_origem: string | null;
  endereco_destino: string | null;
  previsao_coleta: string | null;
  items?: Array<{ name: string | null; quantity: number | null; description: string | null }> | null;
  contrato: string | null;
  nf_glbl: string | null;
  partner_code: string | null;
  responsavel: string | null;
  responsible_user_id: string | null;
  driver?: { name: string | null } | null;
  transportadora?: { name: string | null } | null;
  freight_value: number | null;
  status_coleta: string;
  telefone: string | null;
  email: string | null;
  attachments?: FileAttachment[] | null;
}

interface EntregaListItemProps {
  entrega: Entrega;
  index: number;
  onEdit: (entrega: Entrega) => void;
  onDelete: (id: string) => void;
  onWhatsApp: (entrega: Entrega) => void;
  onEmail: (entrega: Entrega) => void;
  onUpdateStatus: (id: string, name: string, status: string) => void;
  onUpdateResponsible: (id: string, name: string, responsibleUserId: string | null) => void;
  isDeleting: boolean;
}

export const EntregaListItem: React.FC<EntregaListItemProps> = ({
  entrega,
  index,
  onEdit,
  onDelete,
  onWhatsApp,
  onEmail,
  onUpdateStatus,
  onUpdateResponsible,
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
      key={entrega.id}
      className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex-1 min-w-0 mb-3 lg:mb-0">
        <h3 className="font-semibold text-lg">{entrega.parceiro}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Tag className="h-3 w-3" /> {entrega.unique_number}
          {entrega.client_control && (
            <span className="ml-2 flex items-center gap-1">
              <ClipboardList className="h-3 w-3" /> {entrega.client_control}
            </span>
          )}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
          {entrega.endereco_origem && (
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" /> Origem: {entrega.endereco_origem}
            </div>
          )}
          {entrega.endereco_destino && (
            <div className="flex items-center gap-1">
              <Flag className="h-3 w-3" /> Destino: {entrega.endereco_destino}
            </div>
          )}
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" /> Previsão: {entrega.previsao_coleta ? (isValid(new Date(entrega.previsao_coleta)) ? format(new Date(entrega.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida') : 'N/A'}
          </div>
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3" /> Qtd Total: {getTotalQuantityOfItems(entrega.items)}
          </div>
          <div className="flex items-center gap-1 col-span-full">
            <Package className="h-3 w-3" /> Materiais: {formatItemsForColetaModeloAparelho(entrega.items)}
          </div>
          {entrega.contrato && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> Nr. Contrato: {entrega.contrato}
            </div>
          )}
          {entrega.nf_glbl && (
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" /> CONTRATO SANKHYA: {entrega.nf_glbl}
            </div>
          )}
          {entrega.partner_code && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" /> CÓD. PARC: {entrega.partner_code}
            </div>
          )}
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" /> Responsável: {entrega.responsavel || 'Não atribuído'}
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3" /> Motorista: {entrega.driver?.name || 'Não atribuído'}
          </div>
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3" /> Transportadora: {entrega.transportadora?.name || 'Não atribuída'}
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Frete: {entrega.freight_value ? `R$ ${entrega.freight_value.toFixed(2)}` : 'N/A'}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Status: <Badge className={getStatusBadgeColor(entrega.status_coleta)}>{getStatusText(entrega.status_coleta)}</Badge>
          </div>
          {entrega.attachments && entrega.attachments.length > 0 && (
            <div className="flex items-center gap-1 col-span-full">
              <Paperclip className="h-3 w-3" /> Anexos: {entrega.attachments.length}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-accent text-accent hover:bg-accent/10"
          onClick={() => onEdit(entrega)}
        >
          <Edit className="mr-1 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-success-green text-success-green hover:bg-success-green/10"
          onClick={() => onWhatsApp(entrega)}
          disabled={!entrega.telefone || !entrega.parceiro || !entrega.previsao_coleta}
        >
          <MessageSquare className="mr-1 h-3 w-3" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-neural text-neural hover:bg-neural/10"
          onClick={() => onEmail(entrega)}
          disabled={!entrega.email || !entrega.parceiro || !entrega.previsao_coleta}
        >
          <Send className="mr-1 h-3 w-3" />
          E-mail
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-accent text-accent hover:bg-accent/10"
          onClick={() => onUpdateStatus(entrega.id, entrega.parceiro || 'Entrega', entrega.status_coleta)}
        >
          <Edit className="mr-1 h-3 w-3" />
          Status
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={() => onUpdateResponsible(entrega.id, entrega.parceiro || 'Entrega', entrega.responsible_user_id)}
        >
          <User className="mr-1 h-3 w-3" />
          Responsável
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(entrega.id)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Excluir
        </Button>
      </div>
    </div>
  );
};