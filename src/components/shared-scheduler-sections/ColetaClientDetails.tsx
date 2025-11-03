import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label'; // Adicionado: Importação do componente Label
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/Combobox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types_generated';
import { Mail, Phone, Building, Contact } from 'lucide-react';
import type { ParsedCollectionData } from '@/lib/types'; // Updated import path

type Client = Tables<'clients'>;

interface ColetaClientDetailsProps {
  parsedData: ParsedCollectionData;
  handleParsedDataChange: (field: keyof ParsedCollectionData, value: any) => void;
  isFormDisabled: boolean;
}

export const ColetaClientDetails: React.FC<ColetaClientDetailsProps> = ({
  parsedData,
  handleParsedDataChange,
  isFormDisabled,
}) => {
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      return data;
    },
  });

  const clientOptions = clients?.map(client => ({
    value: client.id,
    label: client.name,
    data: client,
  })) || [];

  const selectedClient = clients?.find(client => client.id === parsedData.client_id);

  const handleClientSelect = (value: string) => {
    const client = clients?.find(c => c.id === value) || null;
    if (client) {
      handleParsedDataChange("client_id", client.id);
      handleParsedDataChange("parceiro", client.name);
      handleParsedDataChange("telefone", client.phone || '');
      handleParsedDataChange("email", client.email || '');
      handleParsedDataChange("cnpj", client.cnpj || '');
      handleParsedDataChange("contato", client.contact_person || '');
      if (client.address) {
        handleParsedDataChange("endereco_origem", client.address);
      }
    } else {
      handleParsedDataChange("client_id", null);
      handleParsedDataChange("parceiro", '');
      handleParsedDataChange("telefone", '');
      handleParsedDataChange("email", '');
      handleParsedDataChange("cnpj", '');
      handleParsedDataChange("contato", '');
      handleParsedDataChange("endereco_origem", '');
    }
  };

  return (
    <Card className="card-futuristic">
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Cliente</Label>
            <Combobox
              id="client-name"
              options={clientOptions}
              value={parsedData.client_id || ''}
              onValueChange={handleClientSelect}
              placeholder="Selecione ou digite o cliente"
              searchPlaceholder="Buscar cliente..."
              disabled={isFormDisabled || isLoadingClients}
              currentValueDisplay={selectedClient?.name || parsedData.parceiro || ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-person">Pessoa de Contato</Label>
            <div className="relative">
              <Contact className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="contact-person"
                placeholder="Nome do contato"
                className="pl-10"
                value={parsedData.contato || ''}
                onChange={(e) => handleParsedDataChange("contato", e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="(XX) XXXXX-XXXX"
                className="pl-10"
                value={parsedData.telefone || ''}
                onChange={(e) => handleParsedDataChange("telefone", e.target.value)}
                disabled={isFormDisabled}
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
                placeholder="email@exemplo.com"
                className="pl-10"
                value={parsedData.email || ''}
                onChange={(e) => handleParsedDataChange("email", e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="cnpj"
                placeholder="XX.XXX.XXX/XXXX-XX"
                className="pl-10"
                value={parsedData.cnpj || ''}
                onChange={(e) => handleParsedDataChange("cnpj", e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};