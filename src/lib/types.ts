export interface ParsedItem {
  product_code: string;
  product_description: string;
  quantity: number;
}

export interface ParsedCollectionData {
  unique_number?: string;
  client_control?: string | null;
  parceiro: string;
  contato?: string | null;
  telefone?: string | null;
  email?: string | null;
  cnpj?: string | null;
  endereco_origem: string;
  cep_origem?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  endereco_destino?: string | null;
  cep_destino?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  previsao_coleta: string; // Formato 'yyyy-MM-dd'
  observacao?: string | null;
  responsavel?: string | null; // Técnico Responsável
  status_coleta: 'pendente' | 'agendada' | 'concluida';
  type: 'coleta' | 'entrega';
  items: ParsedItem[];
  contrato?: string | null;
  modelo_aparelho?: string | null;
  modelo_aparelho_description?: string | null;
}

export interface ColetaImportData {
  unique_number?: string;
  client_control?: string | null;
  parceiro: string;
  contato?: string | null;
  telefone?: string | null;
  email?: string | null;
  cnpj?: string | null;
  endereco_origem: string;
  cep_origem?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  endereco_destino?: string | null;
  cep_destino?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  previsao_coleta: string; // Formato 'yyyy-MM-dd'
  qtd_aparelhos_solicitado: number;
  modelo_aparelho: string;
  freight_value?: number | null;
  observacao?: string | null;
  status_coleta: 'pendente' | 'agendada' | 'concluida';
  type: 'coleta' | 'entrega';
}

export interface ProductImportData {
  code: string;
  description?: string | null;
  model?: string | null;
  serial_number?: string | null;
}

export interface ClientImportData {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  cnpj?: string | null;
  contact_person?: string | null;
}