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
  onClientSelected: (client: Client | null) => void; // Adicionado: Prop para lidar com a seleção completa do cliente
  isFormDisabled: boolean;
}

export const ColetaClientDetails: React.FC<ColetaClientDetailsProps> = ({
  parsedData,
  handleParsedDataChange,
  onClientSelected, // Desestruturado
  isFormDisabled,
}) => {
  return (
    <Card className="card-futuristic">
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Cliente</Label>
            <ClientCombobox
              value={parsedData.parceiro || ''}
              onValueChange={(name) => handleParsedDataChange("parceiro", name)} // Atualiza o nome no formulário diretamente
              onClientSelect={onClientSelected} // Passa o handler do pai para o objeto cliente completo
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