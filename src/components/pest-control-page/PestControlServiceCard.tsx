import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit, Trash2, Bug, Calendar as CalendarIcon, User, MapPin, Clock, Paperclip
} from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Tables, Enums } from "@/integrations/supabase/types_generated";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

type PestControlService = Tables<'pest_control_services'> & {
  client?: { name: string } | null;
  responsible_user?: { first_name: string; last_name: string } | null;
  attachments?: FileAttachment[] | null;
};

interface PestControlServiceCardProps {
  service: PestControlService;
  index: number;
  onEdit: (service: PestControlService) => void;
  onDeleteClick: (serviceId: string) => void;
  onViewAttachments: (attachments: FileAttachment[], serviceName: string) => void;
  isDeleting: boolean;
}

export const PestControlServiceCard: React.FC<PestControlServiceCardProps> = ({
  service,
  index,
  onEdit,
  onDeleteClick,
  onViewAttachments,
  isDeleting,
}) => {
  const getStatusBadgeColor = (status: Enums<'pest_service_status'>) => {
    switch (status) {
      case 'agendado': return 'bg-primary/20 text-primary';
      case 'em_andamento': return 'bg-warning-yellow/20 text-warning-yellow';
      case 'concluido': return 'bg-success-green/20 text-success-green';
      case 'cancelado': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getPriorityBadgeColor = (priority: Enums<'pest_service_priority'>) => {
    switch (priority) {
      case 'urgente': return 'bg-destructive/20 text-destructive';
      case 'contrato': return 'bg-neural/20 text-neural';
      case 'normal': return 'bg-muted/20 text-muted-foreground';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const validAttachments = service.attachments?.filter(file => 
    file && typeof file.size === 'number' && file.name && file.url && file.type
  ) || [];

  return (
    <div
      key={service.id}
      className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-lg border border-primary/10 bg-slate-darker/10 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex-1 min-w-0 mb-3 lg:mb-0">
        <h3 className="font-semibold text-lg">{service.client?.name || 'Cliente Desconhecido'}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {service.address}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" /> Data: {format(new Date(service.service_date), 'dd/MM/yyyy', { locale: ptBR })} {service.service_time && `(${service.service_time})`}
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" /> Técnico: {service.responsible_user ? `${service.responsible_user.first_name} ${service.responsible_user.last_name || ''}`.trim() : 'Não atribuído'}
          </div>
          <div className="flex items-center gap-1">
            <Bug className="h-3 w-3" /> Pragas: {(service.pests_detected as string[] || []).join(', ') || 'N/A'}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Duração Est.: {service.estimated_duration ? `${service.estimated_duration} min` : 'N/A'}
          </div>
          <div className="flex items-center gap-1">
            Status: <Badge className={getStatusBadgeColor(service.status)}>{service.status}</Badge>
          </div>
          <div className="flex items-center gap-1">
            Prioridade: <Badge className={getPriorityBadgeColor(service.priority)}>{service.priority}</Badge>
          </div>
          {validAttachments.length > 0 && (
            <div className="flex items-center gap-1 col-span-full">
              <Paperclip className="h-3 w-3" /> Anexos: {validAttachments.length}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 px-2 text-xs text-primary hover:bg-primary/10"
                onClick={() => onViewAttachments(validAttachments, service.client?.name || 'Serviço')}
              >
                Ver Anexos
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-accent text-accent hover:bg-accent/10"
          onClick={() => onEdit(service)}
        >
          <Edit className="mr-1 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => onDeleteClick(service.id)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Excluir
        </Button>
      </div>
    </div>
  );
};