import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { Calendar as CalendarIcon, Package, Truck, UserPlus, Building } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientCombobox } from "./ClientCombobox";
import { ProductCombobox } from "./ProductCombobox";
import { ResponsibleUserCombobox } from "./ResponsibleUserCombobox";
import { DriverCombobox } from "./DriverCombobox"; // Importar DriverCombobox
import { TransportadoraCombobox } from "./TransportadoraCombobox"; // Importar TransportadoraCombobox

type Coleta = Tables<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>; // Adicionar tipo Driver
type Transportadora = Tables<'transportadoras'>; // Adicionar tipo Transportadora

interface EditEntregaFormProps {
  entrega: Coleta;
  onUpdate: (entrega: ColetaUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const EditEntregaForm: React.FC<EditEntregaFormProps> = ({ entrega, onUpdate, onCancel, isPending }) => {
  const [formData, setFormData] = useState<ColetaUpdate>({
    id: entrega.id,
    parceiro: entrega.parceiro || '',
    endereco: entrega.endereco || '',
    previsao_coleta: entrega.previsao_coleta || '',
    qtd_aparelhos_solicitado: entrega.qtd_aparelhos_solicitado || 0,
    modelo_aparelho: entrega.modelo_aparelho || '',
    status_coleta: entrega.status_coleta || 'agendada',
    observacao: entrega.observacao || '',
    telefone: entrega.telefone || '',
    email: entrega.email || '',
    contato: entrega.contato || '',
    responsavel: entrega.responsavel || '',
    responsible_user_id: entrega.responsible_user_id || null,
    client_id: entrega.client_id || null,
    type: entrega.type || 'entrega', // Manter o tipo
    driver_id: entrega.driver_id || null, // Novo campo
    transportadora_id: entrega.transportadora_id || null, // Novo campo
  });

  useEffect(() => {
    setFormData({
      id: entrega.id,
      parceiro: entrega.parceiro || '',
      endereco: entrega.endereco || '',
      previsao_coleta: entrega.previsao_coleta || '',
      qtd_aparelhos_solicitado: entrega.qtd_aparelhos_solicitado || 0,
      modelo_aparelho: entrega.modelo_aparelho || '',
      status_coleta: entrega.status_coleta || 'agendada',
      observacao: entrega.observacao || '',
      telefone: entrega.telefone || '',
      email: entrega.email || '',
      contato: entrega.contato || '',
      responsavel: entrega.responsavel || '',
      responsible_user_id: entrega.responsible_user_id || null,
      client_id: entrega.client_id || null,
      type: entrega.type || 'entrega',
      driver_id: entrega.driver_id || null,
      transportadora_id: entrega.transportadora_id || null,
    });
  }, [entrega]);

  const handleInputChange = (field: keyof ColetaUpdate, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientComboboxSelect = (client: Client | null) => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        parceiro: client.name,
        telefone: client.phone || '',
        email: client.email || '',
        endereco: client.address || '',
        cnpj: client.cnpj || '',
        contato: client.contact_person || '',
        client_id: client.id,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        client_id: null,
      }));
    }
  };

  const handleProductComboboxSelect = (product: Product | null) => {
    if (product) {
      setFormData(prev => ({
        ...prev,
        modelo_aparelho: product.code,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        modelo_aparelho: "",
      }));
    }
  };

  const handleResponsibleUserSelect = (userProfile: Profile | null) => {
    setFormData(prev => ({
      ...prev,
      responsible_user_id: userProfile?.id || null,
      responsavel: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : null,
    }));
  };

  const handleDriverSelect = (driver: Driver | null) => {
    setFormData(prev => ({
      ...prev,
      driver_id: driver?.id || null,
    }));
  };

  const handleTransportadoraSelect = (transportadora: Transportadora | null) => {
    setFormData(prev => ({
      ...prev,
      transportadora_id: transportadora?.id || null,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parceiro">Cliente</Label>
          <ClientCombobox
            value={formData.parceiro || ''}
            onValueChange={(name) => handleInputChange("parceiro", name)}
            onClientSelect={handleClientComboboxSelect}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contato">Pessoa de Contato</Label>
          <Input
            id="contato"
            value={formData.contato || ''}
            onChange={(e) => handleInputChange("contato", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone || ''}
            onChange={(e) => handleInputChange("telefone", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="previsao_coleta">Data da Entrega</Label>
          <Input
            id="previsao_coleta"
            type="date"
            value={formData.previsao_coleta || ''}
            onChange={(e) => handleInputChange("previsao_coleta", e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qtd_aparelhos_solicitado">Quantidade de Aparelhos</Label>
          <Input
            id="qtd_aparelhos_solicitado"
            type="number"
            placeholder="0"
            value={formData.qtd_aparelhos_solicitado || 0}
            onChange={(e) => handleInputChange("qtd_aparelhos_solicitado", parseInt(e.target.value) || 0)}
            required
            min={0}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modelo_aparelho">Tipo de Material</Label>
          <ProductCombobox
            value={formData.modelo_aparelho || ''}
            onValueChange={(code) => handleInputChange("modelo_aparelho", code)}
            onProductSelect={handleProductComboboxSelect}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status_coleta">Status</Label>
          <Select value={formData.status_coleta || 'agendada'} onValueChange={(value) => handleInputChange("status_coleta", value)} disabled={isPending}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agendada">Em Trânsito</SelectItem>
              <SelectItem value="concluida">Entregue</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          value={formData.endereco || ''}
          onChange={(e) => handleInputChange("endereco", e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="driver">Motorista</Label>
          <DriverCombobox
            value={formData.driver_id}
            onValueChange={(id) => handleInputChange("driver_id", id)}
            onDriverSelect={handleDriverSelect}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transportadora">Transportadora</Label>
          <TransportadoraCombobox
            value={formData.transportadora_id}
            onValueChange={(id) => handleInputChange("transportadora_id", id)}
            onTransportadoraSelect={handleTransportadoraSelect}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsible_user">Responsável pela Entrega</Label>
        <ResponsibleUserCombobox
          value={formData.responsible_user_id || null}
          onValueChange={(id) => handleInputChange("responsible_user_id", id)}
          onUserSelect={handleResponsibleUserSelect}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="observacao">Observações</Label>
        <Textarea
          id="observacao"
          value={formData.observacao || ''}
          onChange={(e) => handleInputChange("observacao", e.target.value)}
          rows={3}
          disabled={isPending}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-primary hover:bg-gradient-primary/80" disabled={isPending}>
          {isPending ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Truck className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};