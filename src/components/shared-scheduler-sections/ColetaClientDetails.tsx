import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mail, Phone, Building, Contact } from 'lucide-react';
import { ClientCombobox } from '@/components/ClientCombobox'; // Usar o ClientCombobox dedicado
import type { ParsedCollectionData } from '@/lib/types';
import type { Tables } from '@/integrations/supabase/types_generated';

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
  // Handler para quando um cliente é selecionado no ClientCombobox
  const handleClientSelect = (clientName: string, client: Client | null) => {
    // Atualiza o campo 'parceiro' com o nome do cliente selecionado/digitado
    handleParsedDataChange("parceiro", clientName);

    if (client) {
      // Se um cliente existente foi selecionado, preenche os outros campos
      handleParsedDataChange("client_id", client.id);
      handleParsedDataChange("telefone", client.phone || '');
      handleParsedDataChange("email", client.email || '');
      handleParsedDataChange("cnpj", client.cnpj || '');
      handleParsedDataChange("contato", client.contact_person || '');
      if (client.address) {
        handleParsedDataChange("endereco_origem", client.address);
        handleParsedDataChange("cep_origem", client.cep || null);
      }
    } else {
      // Se o cliente foi desmarcado ou um novo nome foi digitado, limpa os campos relacionados ao cliente
      handleParsedDataChange("client_id", null);
      // Não limpa 'parceiro' aqui, pois ele já foi atualizado com clientName
      handleParsedDataChange("telefone", '');
      handleParsedDataChange("email", '');
      handleParsedDataChange("cnpj", '');
      handleParsedDataChange("contato", '');
      // Opcionalmente, limpa os campos de endereço se eles foram derivados do cliente
      // handleParsedDataChange("endereco_origem", '');
      // handleParsedDataChange("cep_origem", null);
    }
  };

  return (
    <Card className="card-futuristic">
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Cliente</Label>
            <ClientCombobox
              value={parsedData.parceiro || ''} // O ClientCombobox espera o nome do cliente como valor
              onValueChange={(name) => handleClientSelect(name, null)} // Atualiza o nome no formulário
              onClientSelect={(client) => handleClientSelect(client?.name || '', client)} // Passa o objeto cliente completo
              disabled={isFormDisabled}
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