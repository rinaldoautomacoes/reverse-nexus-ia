import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Edit, ListChecks, Truck, CheckCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

type Coleta = Tables<'coletas'> & { items?: Array<Tables<'items'>> | null; }; // Adicionado items relation
type ColetaUpdate = TablesUpdate<'coletas'>;
type OutstandingCollectionItem = Tables<'outstanding_collection_items'>;
type OutstandingCollectionItemUpdate = TablesUpdate<'outstanding_collection_items'>;

interface CollectionStatusUpdateDialogProps {
  collectionId: string;
  collectionName: string;
  currentCollectionStatus: string; // Adicionado para inicializar o select
  isOpen: boolean;
  onClose: () => void;
}

const collectionStatusOptions = [
  { value: 'pendente', label: 'Coleta Pendente', icon: Clock, color: 'text-destructive', bgColor: 'bg-destructive/10' }, // Agora será ai-purple
  { value: 'agendada', label: 'Coleta Em Trânsito', icon: Truck, color: 'text-warning-yellow', bgColor: 'bg-warning-yellow/10' }, // Já é amarelo
  { value: 'concluida', label: 'Coleta Entregue em nossa unidade', icon: CheckCircle, color: 'text-success-green', bgColor: 'bg-success-green/10' }, // Agora será neon-cyan
];

export const CollectionStatusUpdateDialog: React.FC<CollectionStatusUpdateDialogProps> = ({ collectionId, collectionName, currentCollectionStatus, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedStatus, setSelectedStatus] = useState(currentCollectionStatus);

  useEffect(() => {
    setSelectedStatus(currentCollectionStatus);
  }, [currentCollectionStatus]);

  const updateCollectionStatusMutation = useMutation({
    mutationFn: async (updatedStatus: string) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para atualizar o status da coleta.");
      }

      // 1. Update the collection status
      const { data: updatedColeta, error: updateError } = await supabase
        .from('coletas')
        .update({ status_coleta: updatedStatus })
        .eq('id', collectionId)
        .eq('user_id', user.id) // Adicionado user_id para RLS
        .select(`*, items(name, quantity)`) // Corrected: Select 'name' instead of 'product_code' from items
        .single();
      
      if (updateError) throw new Error(updateError.message);

      // 2. If status is 'concluida', debit from outstanding_collection_items
      if (updatedStatus === 'concluida' && updatedColeta?.items && updatedColeta.items.length > 0) {
        for (const collectedItem of updatedColeta.items) {
          if (!collectedItem.name || !collectedItem.quantity) continue; // Corrected: Use collectedItem.name

          // Find matching outstanding item
          const { data: outstandingItems, error: fetchOutstandingError } = await supabase
            .from('outstanding_collection_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_code', collectedItem.name) // Corrected: Use collectedItem.name to match product_code in outstanding_collection_items
            .eq('status', 'pendente') // Only debit from 'pendente' items
            .order('created_at', { ascending: true }); // Debit from older items first

          if (fetchOutstandingError) {
            console.error("Erro ao buscar itens pendentes para débito:", fetchOutstandingError.message);
            toast({ title: "Erro no débito de itens pendentes", description: `Falha ao buscar itens pendentes para ${collectedItem.name}.`, variant: "destructive" }); // Corrected: Use collectedItem.name
            continue;
          }

          let remainingToDebit = collectedItem.quantity;

          for (const outstandingItem of outstandingItems || []) {
            if (remainingToDebit <= 0) break; // All collected quantity has been debited

            const currentPending = outstandingItem.quantity_pending || 0;
            const debitedAmount = Math.min(remainingToDebit, currentPending);
            const newPending = currentPending - debitedAmount;
            remainingToDebit -= debitedAmount;

            const updateData: OutstandingCollectionItemUpdate = {
              quantity_pending: newPending,
              status: newPending <= 0 ? 'coletado' : 'pendente',
            };

            const { error: updateOutstandingError } = await supabase
              .from('outstanding_collection_items')
              .update(updateData)
              .eq('id', outstandingItem.id)
              .eq('user_id', user.id); // RLS check

            if (updateOutstandingError) {
              console.error("Erro ao atualizar item pendente:", updateOutstandingError.message);
              toast({ title: "Erro no débito de itens pendentes", description: `Falha ao atualizar item pendente ${outstandingItem.product_code}.`, variant: "destructive" });
            } else {
              console.log(`Debited ${debitedAmount} from outstanding item ${outstandingItem.product_code}. New pending: ${newPending}`);
            }
          }

          if (remainingToDebit > 0) {
            toast({ title: "Aviso de Débito", description: `A quantidade coletada de ${collectedItem.name} (${collectedItem.quantity}) excedeu o saldo pendente registrado. ${remainingToDebit} unidades não foram debitadas.`, variant: "warning" }); // Corrected: Use collectedItem.name
          }
        }
        queryClient.invalidateQueries({ queryKey: ['outstandingCollectionItems', user?.id] }); // Invalida a lista de itens pendentes
      }

      return updatedColeta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coletas', user?.id] }); // Invalida a lista de coletas
      queryClient.invalidateQueries({ queryKey: ['collectionStatusChart', user?.id] }); // Invalida o gráfico de rosca
      queryClient.invalidateQueries({ queryKey: ['coletasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['coletasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardColetasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['productStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] });
      toast({ title: "Status da Coleta Atualizado!", description: `O status da coleta "${collectionName}" foi salvo com sucesso.` });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar status da coleta", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveStatus = () => {
    updateCollectionStatusMutation.mutate(selectedStatus);
  };

  const getStatusBadgeClasses = (status: string) => {
    const option = collectionStatusOptions.find(opt => opt.value === status);
    return option ? `${option.bgColor} ${option.color}` : 'bg-muted/20 text-muted-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 gradient-text">
            <ListChecks className="h-5 w-5" />
            Situação da Coleta: {collectionName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="collection-status">Status da Coleta</Label>
            <Select 
              value={selectedStatus} 
              onValueChange={setSelectedStatus} 
              disabled={updateCollectionStatusMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {collectionStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className={`h-4 w-4 ${option.color}`} /> {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateCollectionStatusMutation.isPending}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              className="bg-gradient-primary hover:bg-gradient-primary/80" 
              onClick={handleSaveStatus} 
              disabled={updateCollectionStatusMutation.isPending}
            >
              {updateCollectionStatusMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Edit className="mr-2 h-4 w-4" />
              )}
              Salvar Status
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};