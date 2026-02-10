import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Gauge, TrendingUp, Palette, Zap, Package, Truck, Clock, CheckCircle, ListChecks } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type MetricInsert = TablesInsert<'metrics'>;
type MetricUpdate = TablesUpdate<'metrics'>;

interface MetricFormProps {
  initialData?: MetricUpdate;
  onSave: (data: MetricInsert | MetricUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const MetricForm: React.FC<MetricFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const [formData, setFormData] = useState<MetricInsert | MetricUpdate>(initialData || {
    title: "",
    value: "",
    change: "",
    trend: "up", // Default to 'up'
    icon_name: "Gauge", // Default icon
    color: "text-primary", // Default color
    bg_color: "bg-primary/10", // Default background color
    user_id: "", // Will be filled by mutation
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof (MetricInsert | MetricUpdate), value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Mapeamento de nomes de ícones para componentes Lucide React
  const iconOptions = [
    { value: "Gauge", label: "Gauge", icon: Gauge },
    { value: "TrendingUp", label: "Trending Up", icon: TrendingUp },
    { value: "Palette", label: "Palette", icon: Palette },
    { value: "Zap", label: "Zap", icon: Zap },
    { value: "Package", label: "Package", icon: Package },
    { value: "Truck", label: "Truck", icon: Truck },
    { value: "Clock", label: "Clock", icon: Clock },
    { value: "CheckCircle", label: "Check Circle", icon: CheckCircle },
    { value: "ListChecks", label: "List Checks", icon: ListChecks },
  ];

  const colorOptions = [
    { value: "text-primary", label: "Primary", bgColor: "bg-primary/10", textColor: "text-primary" },
    { value: "text-secondary", label: "Secondary", bgColor: "bg-secondary/10", textColor: "text-secondary" },
    { value: "text-destructive", label: "Destructive", bgColor: "bg-destructive/10", textColor: "text-destructive" },
    { value: "text-accent", label: "Accent", bgColor: "bg-accent/10", textColor: "text-accent" },
    { value: "text-neon-cyan", label: "Neon Cyan", bgColor: "bg-neon-cyan/10", textColor: "text-neon-cyan" },
    { value: "text-neural", label: "Neural Blue", bgColor: "bg-neural/10", textColor: "text-neural" },
    { value: "text-ai-purple", label: "AI Purple", bgColor: "bg-ai-purple/10", textColor: "text-ai-purple" },
    { value: "text-warning-yellow", label: "Warning Yellow", bgColor: "bg-warning-yellow/10", textColor: "text-warning-yellow" },
    { value: "text-success-green", label: "Success Green", bgColor: "bg-success-green/10", textColor: "text-success-green" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título da Métrica *</Label>
        <Input
          id="title"
          placeholder="Ex: Coletas Concluídas"
          value={formData.title || ''}
          onChange={(e) => handleInputChange("title", e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="value">Valor *</Label>
          <Input
            id="value"
            placeholder="Ex: 150, 95%"
            value={formData.value || ''}
            onChange={(e) => handleInputChange("value", e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="change">Mudança</Label>
          <Input
            id="change"
            placeholder="Ex: +10%, -5"
            value={formData.change || ''}
            onChange={(e) => handleInputChange("change", e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trend">Tendência</Label>
          <Select
            value={formData.trend || 'up'}
            onValueChange={(value) => handleInputChange("trend", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar tendência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="up">Para Cima</SelectItem>
              <SelectItem value="down">Para Baixo</SelectItem>
              <SelectItem value="neutral">Neutro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="icon_name">Ícone</Label>
          <Select
            value={formData.icon_name || 'Gauge'}
            onValueChange={(value) => handleInputChange("icon_name", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar ícone" />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map(option => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" /> {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Cor do Ícone/Texto</Label>
          <Select
            value={formData.color || 'text-primary'}
            onValueChange={(value) => handleInputChange("color", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar cor" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${option.bgColor} ${option.textColor}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bg_color">Cor de Fundo do Ícone</Label>
          <Select
            value={formData.bg_color || 'bg-primary/10'}
            onValueChange={(value) => handleInputChange("bg_color", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar cor de fundo" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map(option => (
                <SelectItem key={option.bgColor} value={option.bgColor}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${option.bgColor}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
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
            <Gauge className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Adicionar Métrica"}
        </Button>
      </div>
    </form>
  );
};