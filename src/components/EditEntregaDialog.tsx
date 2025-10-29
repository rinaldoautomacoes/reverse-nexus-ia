import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, MinusCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Entrega = Tables<'coletas'> & {
  driver?: { name: string } | null;
  transportadora?: { name: string } | null;
  items?: Array<Tables<'items'>> | null;
};

interface EditEntregaDialogProps {
  entrega: Entrega;
  isOpen: boolean;
  onClose: () => void;
}

export const EditEntregaDialog: React.FC<EditEntregaDialogProps> = ({ entrega, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    parceiro: "",
    endereco_origem: "",
    endereco_destino: "",
    previsao_coleta: new Date(),
    modelo_aparelho: "",
    responsavel: "",
    telefone: "",
    email: "",
    observacoes: "",
    status_coleta: "",
    driver_id: "",
    transportadora_id: "",
    freight_value: "",
    client_control: "",
  });

  const [items, setItems] = useState<Array<{ id?: string; name: string; quantity: number }>>([]);

  useEffect(() => {
    if (entrega) {
      setFormData({
        parceiro: entrega.parceiro || "",
        endereco_origem: entrega.endereco_origem || "",
        endereco_destino: entrega.endereco_destino || "",
        previsao_coleta: entrega.previsao_coleta ? new Date(entrega.previsao_coleta) : new Date(),
        modelo_aparelho: entrega.modelo_aparelho || "",
        responsavel: entrega.responsavel || "",
        telefone: entrega.telefone || "",
        email: entrega.email || "",
        observacoes: entrega.observacoes || "",
        status_coleta: entrega.status_coleta || "",
        driver_id: entrega.driver_id || "",
        transportadora_id: entrega.transportadora_id || "",
        freight_value: entrega.freight_value?.toString() || "",
        client_control: entrega.client_control || "",
      });
      setItems(entrega.items || []);
    }
  }, [entrega]);

  const { data: drivers, isLoading: isLoadingDrivers } = useQuery<Tables<'drivers'>[], Error>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: transportadoras, isLoading: isLoadingTransportadoras } = useQuery<Tables<'transportadoras'>[], Error>({
    queryKey: ['transportadoras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transportadoras').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const updateEntregaMutation = useMutation({
    mutationFn: async (updatedEntrega: Partial<Tables<'coletas'>>) => {
      if (!user?.id) throw new Error("User not authenticated.");

      const { error: updateError } = await supabase
        .from('coletas')
        .update(updatedEntrega)
        .eq('id', entrega.id)
        .eq('user_id', user.id);

      if (updateError) throw new Error(updateError.message);

      // Handle items update
      const existingItemIds = items.filter(item => item.id).map(item => item.id);
      const itemsToDelete = (entrega.items || []).filter(oldItem => !existingItemIds.includes(oldItem.id)).map(item => item.id);

      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('items')
          .delete()
          .in('id', itemsToDelete);
        if (deleteError) throw new Error(deleteError.message);
      }

      for (const item of items) {
        if (item.id) {
          // Update existing item
          const { error: updateItemError } = await supabase
            .from('items')
            .update({ name: item.name, quantity: item.quantity })
            .eq('id', item.id);
          if (updateItemError) throw new Error(updateItemError.message);
        } else {
          // Insert new item
          const { error: insertItemError } = await supabase
            .from('items')
            .insert({
              name: item.name,
              quantity: item.quantity,
              coleta_id: entrega.id,
              user_id: user.id,
            });
          if (insertItemError) throw new Error(insertItemError.message);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregasConcluidas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardEntregasMetrics', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entregasAtivasStatusDonutChart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['items', user?.id] }); // Invalidate general items query
      toast({ title: "Entrega Atualizada!", description: "Os detalhes da entrega foram salvos com sucesso." });
      onClose();
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar entrega", description: err.message, variant: "destructive" });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, previsao_coleta: date }));
    }
  };

  const handleItemChange = (index: number, field: 'name' | 'quantity', value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' ? parseInt(value as string) || 0 : value,
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEntregaMutation.mutate({
      ...formData,
      previsao_coleta: format(formData.previsao_coleta, 'yyyy-MM-dd'),
      freight_value: formData.freight_value ? parseFloat(formData.freight_value) : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Entrega: {entrega.parceiro}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parceiro" className="text-right">
              Parceiro
            </Label>
            <Input
              id="parceiro"
              name="parceiro"
              value={formData.parceiro}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client_control" className="text-right">
              Controle Cliente
            </Label>
            <Input
              id="client_control"
              name="client_control"
              value={formData.client_control}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endereco_origem" className="text-right">
              Endereço Origem
            </Label>
            <Input
              id="endereco_origem"
              name="endereco_origem"
              value={formData.endereco_origem}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endereco_destino" className="text-right">
              Endereço Destino
            </Label>
            <Input
              id="endereco_destino"
              name="endereco_destino"
              value={formData.endereco_destino}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="previsao_coleta" className="text-right">
              Data Previsão
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !formData.previsao_coleta && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.previsao_coleta ? format(formData.previsao_coleta, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.previsao_coleta}
                  onSelect={handleDateChange}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelo_aparelho" className="text-right">
              Modelo Aparelho
            </Label>
            <Input
              id="modelo_aparelho"
              name="modelo_aparelho"
              value={formData.modelo_aparelho}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="responsavel" className="text-right">
              Responsável
            </Label>
            <Input
              id="responsavel"
              name="responsavel"
              value={formData.responsavel}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="telefone" className="text-right">
              Telefone
            </Label>
            <Input
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="freight_value" className="text-right">
              Valor do Frete
            </Label>
            <Input
              id="freight_value"
              name="freight_value"
              type="number"
              step="0.01"
              value={formData.freight_value}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status_coleta" className="text-right">
              Status
            </Label>
            <Select
              name="status_coleta"
              value={formData.status_coleta}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status_coleta: value }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_transito">Em Trânsito</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driver_id" className="text-right">
              Motorista
            </Label>
            <Select
              name="driver_id"
              value={formData.driver_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, driver_id: value }))}
              disabled={isLoadingDrivers}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um motorista" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="transportadora_id" className="text-right">
              Transportadora
            </Label>
            <Select
              name="transportadora_id"
              value={formData.transportadora_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, transportadora_id: value }))}
              disabled={isLoadingTransportadoras}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione uma transportadora" />
              </SelectTrigger>
              <SelectContent>
                {transportadoras?.map((transportadora) => (
                  <SelectItem key={transportadora.id} value={transportadora.id}>
                    {transportadora.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="observacoes" className="text-right">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          {/* Seção para Itens */}
          <div className="col-span-4 mt-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Package className="h-5 w-5" /> Itens da Coleta/Entrega
            </h3>
            <div className="space-y-2">
              {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>}
              {items.map((item, index) => (
                <div key={item.id || `new-item-${index}`} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome do Item"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    placeholder="Qtd"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={handleAddItem}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateEntregaMutation.isPending}>
              {updateEntregaMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};