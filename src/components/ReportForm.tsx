import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, FileText, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type ReportInsert = TablesInsert<'reports'>;
type ReportUpdate = TablesUpdate<'reports'>;

interface ReportFormProps {
  initialData?: ReportUpdate;
  onSave: (data: ReportInsert | ReportUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ReportForm: React.FC<ReportFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const [formData, setFormData] = useState<ReportInsert | ReportUpdate>(initialData || {
    title: "",
    description: "",
    type: "coleta", // Default to 'coleta'
    format: "pdf", // Default to 'pdf'
    status: "pendente", // Default status
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    collection_type_filter: "todos", // Default filter
    collection_status_filter: "todos", // Default filter
    user_id: "", // Will be filled by mutation
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof (ReportInsert | ReportUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título do Relatório *</Label>
        <Input
          id="title"
          placeholder="Ex: Relatório Mensal de Coletas"
          value={formData.title || ''}
          onChange={(e) => handleInputChange("title", e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Breve descrição do conteúdo do relatório"
          value={formData.description || ''}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Relatório *</Label>
          <Select
            value={formData.type || 'coleta'}
            onValueChange={(value) => handleInputChange("type", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coleta">Coletas</SelectItem>
              <SelectItem value="entrega">Entregas</SelectItem>
              <SelectItem value="geral">Geral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="format">Formato *</Label>
          <Select
            value={formData.format || 'pdf'}
            onValueChange={(value) => handleInputChange("format", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.start_date && "text-muted-foreground"
                )}
                disabled={isPending}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? format(new Date(formData.start_date), "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.start_date ? new Date(formData.start_date) : undefined}
                onSelect={(date) => handleInputChange("start_date", date ? format(date, 'yyyy-MM-dd') : null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Data de Fim</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.end_date && "text-muted-foreground"
                )}
                disabled={isPending}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.end_date ? format(new Date(formData.end_date), "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.end_date ? new Date(formData.end_date) : undefined}
                onSelect={(date) => handleInputChange("end_date", date ? format(date, 'yyyy-MM-dd') : null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="collection_type_filter">Filtrar por Tipo de Coleta/Entrega</Label>
          <Select
            value={formData.collection_type_filter || 'todos'}
            onValueChange={(value) => handleInputChange("collection_type_filter", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="coleta">Coleta</SelectItem>
              <SelectItem value="entrega">Entrega</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="collection_status_filter">Filtrar por Status</Label>
          <Select
            value={formData.collection_status_filter || 'todos'}
            onValueChange={(value) => handleInputChange("collection_status_filter", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="agendada">Agendada/Em Trânsito</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
            <FileText className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Atualizar Relatório" : "Gerar Relatório"}
        </Button>
      </div>
    </form>
  );
};