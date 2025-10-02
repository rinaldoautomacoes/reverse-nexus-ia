import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Zap, FileText } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

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
    period: "",
    type: "",
    format: "PDF",
    description: "",
    status: "Gerando", // Default status for new reports
    collection_status_filter: "todos", // Default para 'todas'
    collection_type_filter: "coleta", // Definido como 'coleta' por padrão
    user_id: "", // Will be set by the mutation
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof (ReportInsert | ReportUpdate), value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título do Relatório</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Ex: Relatório Mensal de Performance"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="period">Período</Label>
          <Input
            id="period"
            value={formData.period || ''}
            onChange={(e) => handleInputChange("period", e.target.value)}
            placeholder="Ex: Janeiro 2024"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select 
            value={formData.type || ''} 
            onValueChange={(value) => handleInputChange("type", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Completo">Completo</SelectItem>
              <SelectItem value="Operacional">Operacional</SelectItem>
              <SelectItem value="IA Insights">IA Insights</SelectItem>
              <SelectItem value="Performance">Performance</SelectItem>
              <SelectItem value="Eficiência">Eficiência</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="format">Formato</Label>
          <Select 
            value={formData.format || 'PDF'} 
            onValueChange={(value) => handleInputChange("format", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Excel">Excel</SelectItem>
              <SelectItem value="Word">Word</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status do Relatório</Label>
          <Select 
            value={formData.status || 'Gerando'} 
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gerando">Gerando</SelectItem>
              <SelectItem value="Pronto">Pronto</SelectItem>
              <SelectItem value="Falha">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="collection_type_filter">Tipo de Registro</Label>
        <Select 
          value={formData.collection_type_filter || 'coleta'} 
          onValueChange={(value) => handleInputChange("collection_type_filter", value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de registro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coleta">Coleta</SelectItem>
            <SelectItem value="entrega">Entrega</SelectItem>
            <SelectItem value="todos">Coletas e Entregas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="collection_status_filter">Filtrar por Status do Registro</Label>
        <Select 
          value={formData.collection_status_filter || 'todos'} 
          onValueChange={(value) => handleInputChange("collection_status_filter", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="agendada">Agendados/Em Trânsito</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="concluida">Concluídos/Entregues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Descrição detalhada do relatório..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isPending}
          className="flex-1 bg-gradient-primary hover:bg-gradient-primary/80 glow-effect"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              {initialData ? "Salvando..." : "Gerando..."}
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              {initialData ? "Salvar Alterações" : "Gerar Relatório"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};