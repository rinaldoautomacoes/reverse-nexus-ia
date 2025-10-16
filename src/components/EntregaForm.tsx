import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, Calendar as CalendarIcon, User, Phone, Mail, MapPin, Building, Briefcase, Loader2, Hash, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables, TablesUpdate } from "@/integrations/supabase/types_generated";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientCombobox } from "@/components/ClientCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
import { ResponsibleUserCombobox } from "@/components/ResponsibleUserCombobox";
import { DriverCombobox } from "@/components/DriverCombobox";
import { TransportadoraCombobox } from "@/components/TransportadoraCombobox";

type ColetaInsert = TablesInsert<'coletas'>;
type ColetaUpdate = TablesUpdate<'coletas'>;
type Client = Tables<'clients'>;
type Product = Tables<'products'>;
type Profile = Tables<'profiles'>;
type Driver = Tables<'drivers'>;
type Transportadora = Tables<'transportadoras'>;

interface EntregaFormProps {
  initialData?: ColetaUpdate;
  onSave: (data: ColetaInsert | ColetaUpdate) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const EntregaForm: React.FC<EntregaFormProps> = ({ initialData, onSave, onCancel, isPending }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<ColetaInsert | ColetaUpdate>(initialData || {
    parceiro: "",
    endereco: "",
    previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
    qtd_aparelhos_solicitado: 1,
    modelo_aparelho: "",
    status_coleta: "agendada",
    observacao: "",
    telefone: "",
    email: "",
    contato: "",
    responsavel: "",
    responsible_user_id: null,
    client_id: null,
    type: "entrega",
    user_id: user?.id || "",
    cep: "",
    bairro: "",
    cidade: "",
    uf: "",
    localidade: "",
    cnpj: "",
    contrato: "",
    nf_glbl: "",
    nf_metodo: "",
    cep_origem: "",
    cep_destino: "",
    endereco_origem: "",
    endereco_destino: "",
    driver_id: null,
    transportadora_id: null,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form for new entry if no initialData is provided
      setFormData({
        parceiro: "",
        endereco: "",
        previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
        qtd_aparelhos_solicitado: 1,
        modelo_aparelho: "",
        status_coleta: "agendada",
        observacao: "",
        telefone: "",
        email: "",
        contato: "",
        responsavel: "",
        responsible_user_id: null,
        client_id: null,
        type: "entrega",
        user_id: user?.id || "",
        cep: "",
        bairro: "",
        cidade: "",
        uf: "",
        localidade: "",
        cnpj: "",
        contrato: "",
        nf_glbl: "",
        nf_metodo: "",
        cep_origem: "",
        cep_destino: "",
        endereco_origem: "",
        endereco_destino: "",
        driver_id: null,
        transportadora_id: null,
      });
    }
  }, [initialData, user?.id]);

  const handleInputChange = (field: keyof (ColetaInsert | ColetaUpdate), value: string | number | null) => {
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
        telefone: '',
        email: '',
        endereco: '',
        cnpj: '',
        contato: '',
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
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parceiro">Cliente *</Label>
          <ClientCombobox
            value={formData.parceiro || ''}
            onValueChange={(name) => handleInputChange("parceiro", name)}
            onClientSelect={handleClientComboboxSelect}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contato">Pessoa de Contato</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="contato"
              placeholder="Nome do contato"
              className="pl-10"
              value={formData.contato || ''}
              onChange={(e) => handleInputChange("contato", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="telefone"
              placeholder="(XX) XXXXX-XXXX"
              className="pl-10"
              value={formData.telefone || ''}
              onChange={(e) => handleInputChange("telefone", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="contato@cliente.com"
              className="pl-10"
              value={formData.email || ''}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço de Entrega *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="endereco"
            placeholder="Endereço completo para entrega"
            className="pl-10"
            value={formData.endereco || ''}
            onChange={(e) => handleInputChange("endereco", e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="previsao_coleta">Data da Entrega *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal pl-10",
                  !formData.previsao_coleta && "text-muted-foreground"
                )}
                disabled={isPending}
              >
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                {formData.previsao_coleta ? format(new Date(formData.previsao_coleta), "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.previsao_coleta ? new Date(formData.previsao_coleta) : undefined}
                onSelect={(date) => handleInputChange("previsao_coleta", date ? format(date, 'yyyy-MM-dd') : null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="qtd_aparelhos_solicitado">Quantidade de Aparelhos *</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="qtd_aparelhos_solicitado"
              type="number"
              placeholder="1"
              className="pl-10"
              value={formData.qtd_aparelhos_solicitado || 0}
              onChange={(e) => handleInputChange("qtd_aparelhos_solicitado", parseInt(e.target.value) || 0)}
              required
              min={1}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="modelo_aparelho">Tipo de Material *</Label>
        <ProductCombobox
          value={formData.modelo_aparelho || ''}
          onValueChange={(code) => handleInputChange("modelo_aparelho", code)}
          onProductSelect={handleProductComboboxSelect}
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
          placeholder="Informações adicionais sobre a entrega..."
          value={formData.observacao || ''}
          onChange={(e) => handleInputChange("observacao", e.target.value)}
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
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
            <Truck className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Salvar Alterações" : "Agendar Entrega"}
        </Button>
      </div>
    </form>
  );
};