import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Bug, Clock, User, MapPin, Hash, CheckSquare, Loader2, PlusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TablesInsert, TablesUpdate, Enums, Tables } from "@/integrations/supabase/types_generated";
import { ClientCombobox } from "@/components/ClientCombobox";
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import { FileUploadField } from "@/components/FileUploadField";
import { useToast } from "@/hooks/use-toast";

type PestControlServiceInsert = TablesInsert<'pest_control_services'>;
type PestControlServiceUpdate = TablesUpdate<'pest_control_services'>;
type Client = Tables<'clients'>;
type Profile = Tables<'profiles'>;

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface PestControlServiceFormProps {
  initialData?: PestControlServiceUpdate;
  onSave: (data: PestControlServiceInsert | PestControlServiceUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const PestControlServiceForm: React.FC<PestControlServiceFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PestControlServiceInsert | PestControlServiceUpdate>(initialData || {
    service_date: format(new Date(), 'yyyy-MM-dd'),
    address: "",
    status: "agendado",
    priority: "normal",
    pests_detected: [],
    checklist: {},
    attachments: [],
    user_id: "", // Will be filled by mutation
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedResponsibleUser, setSelectedResponsibleUser] = useState<Profile | null>(null);
  const [pestsInput, setPestsInput] = useState<string>("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>(() => {
    const initial = initialData?.attachments;
    if (Array.isArray(initial)) {
      return (initial as unknown as FileAttachment[]).filter((file) => 
        file !== null && typeof file === 'object' && 
        typeof file.size === 'number' && 
        typeof file.name === 'string' && 
        typeof file.url === 'string' && 
        typeof file.type === 'string'
      );
    }
    return [];
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.pests_detected && Array.isArray(initialData.pests_detected)) {
        setPestsInput((initialData.pests_detected as string[]).join(', '));
      }
      if (initialData.checklist && typeof initialData.checklist === 'object' && !Array.isArray(initialData.checklist)) {
        setChecklistItems(Object.keys(initialData.checklist));
      }
      if (Array.isArray(initialData.attachments)) {
        setAttachments((initialData.attachments as unknown as FileAttachment[]).filter((file) => 
          file !== null && typeof file === 'object' && 
          typeof file.size === 'number' && 
          typeof file.name === 'string' && 
          typeof file.url === 'string' && 
          typeof file.type === 'string'
        ));
      } else {
        setAttachments([]);
      }
    }
  }, [initialData]);

  const handleInputChange = useCallback((field: keyof (PestControlServiceInsert | PestControlServiceUpdate), value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClientComboboxSelect = useCallback((client: Client | null) => {
    setSelectedClient(client);
    handleInputChange("client_id", client?.id || null);
    if (client) {
      handleInputChange("address", client.address || "");
    }
  }, [handleInputChange]);

  const handleResponsibleUserSelect = useCallback((userProfile: Profile | null) => {
    setSelectedResponsibleUser(userProfile);
    handleInputChange("responsible_user_id", userProfile?.id || null);
  }, [handleInputChange]);

  const handlePestsInputBlur = () => {
    const pestsArray = pestsInput.split(',').map(p => p.trim()).filter(p => p.length > 0);
    handleInputChange("pests_detected", pestsArray);
  };

  const handleAddChecklistItem = () => {
    setChecklistItems(prev => [...prev, ""]);
  };

  const handleChecklistItemChange = (index: number, value: string) => {
    setChecklistItems(prev => {
      const newItems = [...prev];
      newItems[index] = value;
      return newItems;
    });
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address || formData.address.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Endereço' é obrigatório.", variant: "destructive" });
      return;
    }
    if (!formData.service_date || formData.service_date.trim() === '') {
      toast({ title: "Campo Obrigatório", description: "O campo 'Data do Serviço' é obrigatório.", variant: "destructive" });
      return;
    }

    const finalChecklist = checklistItems.filter(item => item.trim() !== '').reduce((acc, item, idx) => {
      acc[`item_${idx + 1}`] = item;
      return acc;
    }, {} as { [key: string]: string });

    onSave({
      ...formData,
      pests_detected: pestsInput.split(',').map(p => p.trim()).filter(p => p.length > 0),
      checklist: finalChecklist,
      attachments: attachments as unknown as typeof formData.attachments,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_id">Cliente *</Label>
          <ClientCombobox
            value={selectedClient?.name || ''}
            onValueChange={(name) => {
              // This is a workaround as ClientCombobox expects name for onValueChange
              // We primarily use onClientSelect to get the full client object
              if (!name) {
                setSelectedClient(null);
                handleInputChange("client_id", null);
              }
            }}
            onClientSelect={handleClientComboboxSelect}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsible_user_id">Técnico Responsável</Label>
          <ResponsibleUserCombobox
            value={selectedResponsibleUser?.id || null}
            onValueChange={(id) => handleInputChange("responsible_user_id", id)}
            onUserSelect={handleResponsibleUserSelect}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço do Serviço *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            placeholder="Endereço completo do local do serviço"
            className="pl-10"
            value={formData.address || ''}
            onChange={(e) => handleInputChange("address", e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="service_date">Data do Serviço *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal pl-10",
                  !formData.service_date && "text-muted-foreground"
                )}
                disabled={isPending}
              >
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {formData.service_date ? (isValid(new Date(formData.service_date)) ? format(new Date(formData.service_date), "dd/MM/yyyy", { locale: ptBR }) : "Data inválida") : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.service_date ? new Date(formData.service_date) : undefined}
                onSelect={(date) => handleInputChange("service_date", date ? format(date, 'yyyy-MM-dd') : null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_time">Janela de Horário</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="service_time"
              placeholder="Ex: Manhã, 09:00-11:00"
              className="pl-10"
              value={formData.service_time || ''}
              onChange={(e) => handleInputChange("service_time", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status || 'agendado'}
            onValueChange={(value) => handleInputChange("status", value as Enums<'pest_service_status'>)}
            disabled={isPending}
          >
            <SelectTrigger className="pl-10">
              <CheckSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agendado">Agendado</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade *</Label>
          <Select
            value={formData.priority || 'normal'}
            onValueChange={(value) => handleInputChange("priority", value as Enums<'pest_service_priority'>)}
            disabled={isPending}
          >
            <SelectTrigger className="pl-10">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Selecionar prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
              <SelectItem value="contrato">Contrato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pests_detected">Pragas Detectadas (separar por vírgula)</Label>
          <div className="relative">
            <Bug className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="pests_detected"
              placeholder="Ex: Baratas, Ratos, Formigas"
              className="pl-10"
              value={pestsInput}
              onChange={(e) => setPestsInput(e.target.value)}
              onBlur={handlePestsInputBlur}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="environment_type">Tipo de Ambiente</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="environment_type"
              placeholder="Ex: Residencial, Comercial, Industrial"
              className="pl-10"
              value={formData.environment_type || ''}
              onChange={(e) => handleInputChange("environment_type", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimated_duration">Tempo Estimado de Execução (minutos)</Label>
        <div className="relative">
          <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="estimated_duration"
            type="number"
            min="0"
            placeholder="60"
            className="pl-10"
            value={formData.estimated_duration || ''}
            onChange={(e) => handleInputChange("estimated_duration", parseInt(e.target.value) || null)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-border/30 pt-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Checklist do Serviço
        </h4>
        {checklistItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Item ${index + 1} do checklist`}
              value={item}
              onChange={(e) => handleChecklistItemChange(index, e.target.value)}
              disabled={isPending}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveChecklistItem(index)}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddChecklistItem}
          disabled={isPending}
          className="w-full flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Adicionar Item ao Checklist
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          placeholder="Notas adicionais sobre o serviço..."
          value={formData.observations || ''}
          onChange={(e) => handleInputChange("observations", e.target.value)}
          rows={3}
          disabled={isPending}
        />
      </div>

      <FileUploadField
        label="Anexos do Serviço"
        initialFiles={attachments}
        onFilesChange={setAttachments}
        disabled={isPending}
      />

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bug className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Agendar Serviço"}
        </Button>
      </div>
    </form>
  );
};