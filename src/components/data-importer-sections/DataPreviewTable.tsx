import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ColetaImportData, ProductImportData, ClientImportData, TechnicianImportData } from '@/lib/types'; // Adicionado TechnicianImportData

interface DataPreviewTableProps {
  activeTab: 'collections' | 'products' | 'clients' | 'technicians'; // Adicionado 'technicians'
  extractedData: ColetaImportData[] | ProductImportData[] | ClientImportData[] | TechnicianImportData[] | null; // Adicionado TechnicianImportData
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({ activeTab, extractedData }) => {
  if (!extractedData || extractedData.length === 0) {
    return null;
  }

  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success-green" />
          Pré-visualização dos Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="max-h-96 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {activeTab === 'collections' ? (
                  <>
                    <TableHead>Nº Coleta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço Origem</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Status</TableHead>
                  </>
                ) : activeTab === 'products' ? (
                  <>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Nº Série</TableHead>
                  </>
                ) : activeTab === 'clients' ? ( // Adicionado para clientes
                  <>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                  </>
                ) : ( // Caso 'technicians'
                  <>
                    <TableHead>Primeiro Nome</TableHead>
                    <TableHead>Sobrenome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>ID Supervisor</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTab === 'collections' ? (
                (extractedData as ColetaImportData[]).map((item: ColetaImportData, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.unique_number}</TableCell>
                    <TableCell>{item.type === 'coleta' ? 'Coleta' : 'Entrega'}</TableCell>
                    <TableCell>{item.parceiro}</TableCell>
                    <TableCell>{item.endereco_origem}</TableCell>
                    <TableCell>{format(new Date(item.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>{item.modelo_aparelho}</TableCell>
                    <TableCell>{item.qtd_aparelhos_solicitado}</TableCell>
                    <TableCell>{item.status_coleta}</TableCell>
                  </TableRow>
                ))
              ) : activeTab === 'products' ? (
                (extractedData as ProductImportData[]).map((item: ProductImportData, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>{item.serial_number}</TableCell>
                  </TableRow>
                ))
              ) : activeTab === 'clients' ? ( // Adicionado para clientes
                (extractedData as ClientImportData[]).map((item: ClientImportData, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.address}</TableCell>
                    <TableCell>{item.cnpj}</TableCell>
                    <TableCell>{item.contact_person}</TableCell>
                  </TableRow>
                ))
              ) : ( // Caso 'technicians'
                (extractedData as TechnicianImportData[]).map((item: TechnicianImportData, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.first_name}</TableCell>
                    <TableCell>{item.last_name}</TableCell>
                    <TableCell>{item.phone_number}</TableCell>
                    <TableCell>{item.role}</TableCell>
                    <TableCell>{item.supervisor_id || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};