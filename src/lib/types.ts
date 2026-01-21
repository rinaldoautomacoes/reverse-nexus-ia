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
  origin_address_number?: string | null; // Novo campo
  endereco_destino?: string | null;
  cep_destino?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  destination_address_number?: string | null; // Novo campo
  previsao_coleta: string; // Formato 'yyyy-MM-dd'
  observacao?: string | null;
  responsavel?: string | null; // Técnico Responsável
  status_coleta: 'pendente' | 'agendada' | 'concluida';
  type: 'coleta' | 'entrega';
  items: ParsedItem[];
  contrato?: string | null; // Novo campo
  nf_glbl?: string | null; // Novo campo
  partner_code?: string | null; // Novo campo
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
  origin_address_number?: string | null; // Novo campo
  endereco_destino?: string | null;
  cep_destino?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  destination_address_number?: string | null; // Novo campo
  previsao_coleta: string; // Formato 'yyyy-MM-dd'
  qtd_aparelhos_solicitado: number;
  modelo_aparelho: string;
  freight_value?: number | null;
  observacao?: string | null;
  status_coleta: 'pendente' | 'agendada' | 'concluida';
  type: 'coleta' | 'entrega';
  contrato?: string | null; // Novo campo
  nf_glbl?: string | null; // Novo campo
  partner_code?: string | null; // Novo campo
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
  address_number?: string | null; // Novo campo
  cep?: string | null; // Novo campo
  cnpj?: string | null;
  contact_person?: string | null;
}

export interface TechnicianImportData { // Nova interface para técnicos
  first_name: string;
  last_name: string | null; // Pode ser nulo
  email: string | null; // Pode ser nulo
  password?: string; // Senha pode ser opcional se o sistema gerar uma
  phone_number?: string | null; // Telefone da Empresa
  personal_phone_number?: string | null; // Telefone Pessoal
  role?: 'standard' | 'admin'; // Padrão para 'standard'
  supervisor_id?: string | null;
  team_shift?: 'day' | 'night'; // Novo campo
  address?: string | null; // Novo campo
}

export interface SupervisorImportData { // Nova interface para supervisores
  first_name: string;
  last_name: string | null; // Pode ser nulo
  email: string | null; // Pode ser nulo
  password?: string; // Senha pode ser opcional se o sistema gerar uma
  phone_number?: string | null; // Telefone da Empresa
  personal_phone_number?: string | null; // Telefone Pessoal
  role?: 'standard' | 'admin'; // Padrão para 'standard'
  team_shift?: 'day' | 'night'; // Novo campo
  address?: string | null; // Novo campo
  // supervisor_id é implicitamente null para supervisores
}