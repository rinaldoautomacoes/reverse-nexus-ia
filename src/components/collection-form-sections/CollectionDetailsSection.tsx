import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, ClipboardList, FileText, Hash } from "lucide-react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types_generated";

type ColetaFormData = TablesInsert<'coletas'> | TablesUpdate<'coletas'>;

interface CollectionDetailsSectionProps {
  formData: ColetaFormData;
  handleInputChange: (field: keyof ColetaFormData, value: string | number | null) => void;
  isPending: boolean;
}

export const CollectionDetailsSection: React.FC<CollectionDetailsSectionProps> = ({
  formData,
  handleInputChange,
  isPending,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unique_number">Código da Coleta</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="unique_number"
              value={formData.unique_number || ''}
              readOnly
              className="pl-10 bg-muted/50"
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_control">Controle do Cliente</Label>
          <div className="relative">
            <ClipboardList className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="client_control"
              placeholder="Ex: OS-12345, Pedido-987"
              className="pl-10"
              value={formData.client_control || ''}
              onChange={(e) => handleInputChange("client_control", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contrato">Nr. Contrato</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="contrato"
              placeholder="Ex: VMC10703/22"
              className="pl-10"
              value={formData.contrato || ''}
              onChange={(e) => handleInputChange("contrato", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nf_glbl">CONTRATO SANKHYA</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="nf_glbl"
              placeholder="Ex: 26192"
              className="pl-10"
              value={formData.nf_glbl || ''}
              onChange={(e) => handleInputChange("nf_glbl", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner_code">CÓD. PARC</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="partner_code"
              placeholder="Ex: 53039"
              className="pl-10"
              value={formData.partner_code || ''}
              onChange={(e) => handleInputChange("partner_code", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>
    </>
  );
};