import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle } from "lucide-react";
import { ColetaForm } from "@/components/ColetaForm";
import type { TablesInsert } from "@/integrations/supabase/types_generated";
import { ItemData } from "@/components/coleta-form-sections/ColetaItemRow";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

type ColetaInsert = TablesInsert<'coletas'>;

interface CreateColetaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { coleta: ColetaInsert; items: ItemData[]; attachments: FileAttachment[] }) => void;
  isPending: boolean;
}

export const CreateColetaDialog: React.FC<CreateColetaDialogProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  isPending,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/80">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Coleta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] bg-card border-primary/20 max-h-[calc(100vh-150px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <Package className="h-5 w-5" />
            Agendar Nova Coleta
          </DialogTitle>
        </DialogHeader>
        <ColetaForm
          onSave={({ coleta, items, attachments }) => onSave({ coleta, items, attachments })}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
};