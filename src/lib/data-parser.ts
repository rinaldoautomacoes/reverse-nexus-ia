import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { generateUniqueNumber } from './utils';
import { parseDateSafely } from './date-utils';
import type { ColetaImportData, ProductImportData, ClientImportData, TechnicianImportData } from './types';
import { cleanPhoneNumber } from './document-parser'; // Import cleanPhoneNumber

// Helper to find a column value by trying multiple possible headers
const findColumnValue = (row: any, possibleHeaders: string[]) => {
  for (const header of possibleHeaders) {
    if (row[header] !== undefined && row[header] !== null && String(row[header]).trim() !== '') {
      return row[header];
    }
  }
  return null;
};

// Helper to clean phone numbers, keeping only digits
export const cleanPhoneNumber = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, ''); // Remove all non-digit characters
  return cleaned.length > 0 ? cleaned : null;
};

// --- Base File Reading Functions ---

const readWorkbookToJson = (file: File, type: 'array' | 'string'): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = type === 'array' ? new Uint8Array(e.target?.result as ArrayBuffer) : e.target?.result as string;
        const workbook = XLSX.read(data, { type: type });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error: any) {
        reject(new Error(`Erro ao ler arquivo ${file.name}: ${error.message}`));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    if (type === 'array') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

const readJsonFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const json: any[] = JSON.parse(jsonString);
        resolve(json);
      } catch (error: any) {
        reject(new Error(`Erro ao ler arquivo JSON ${file.name}: ${error.message}`));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

// --- Data Mapping Functions ---

const mapColetaRow = (row: any): ColetaImportData => ({
  unique_number: findColumnValue(row, ['Número da Coleta', 'unique_number']) || generateUniqueNumber('IMP'),
  client_control: findColumnValue(row, ['Controle do Cliente', 'client_control']) || null,
  parceiro: String(findColumnValue(row, ['Cliente', 'parceiro']) || 'Cliente Desconhecido'),
  contato: findColumnValue(row, ['Contato', 'contato']) || null,
  telefone: cleanPhoneNumber(findColumnValue(row, ['Telefone', 'telefone'])),
  email: findColumnValue(row, ['Email', 'email']) || null,
  cnpj: findColumnValue(row, ['CNPJ', 'cnpj']) ? String(findColumnValue(row, ['CNPJ', 'cnpj'])) : null,
  endereco_origem: String(findColumnValue(row, ['Endereço de Origem', 'Endereço', 'endereco_origem']) || 'Endereço Desconhecido'),
  cep_origem: findColumnValue(row, ['CEP de Origem', 'CEP', 'cep_origem']) ? String(findColumnValue(row, ['CEP de Origem', 'CEP', 'cep_origem'])) : null,
  origin_address_number: findColumnValue(row, ['Número Endereço Origem', 'origin_address_number']) ? String(findColumnValue(row, ['Número Endereço Origem', 'origin_address_number'])) : null,
  endereco_destino: findColumnValue(row, ['Endereço de Destino', 'endereco_destino']) || null,
  cep_destino: findColumnValue(row, ['CEP de Destino', 'cep_destino']) ? String(findColumnValue(row, ['CEP de Destino', 'cep_destino'])) : null,
  destination_address_number: findColumnValue(row, ['Número Endereço Destino', 'destination_address_number']) ? String(findColumnValue(row, ['Número Endereço Destino', 'destination_address_number'])) : null,
  previsao_coleta: parseDateSafely(findColumnValue(row, ['Data da Coleta', 'previsao_coleta'])),
  qtd_aparelhos_solicitado: parseInt(String(findColumnValue(row, ['Quantidade', 'qtd_aparelhos_solicitado']) || 1)),
  modelo_aparelho: String(findColumnValue(row, ['Produto', 'modelo_aparelho']) || 'Produto Desconhecido'),
  freight_value: parseFloat(String(findColumnValue(row, ['Valor do Frete', 'freight_value']) || 0)) || null,
  observacao: findColumnValue(row, ['Observações', 'observacao']) || null,
  status_coleta: (String(findColumnValue(row, ['Status', 'status_coleta']) || '').toLowerCase() === 'concluida' ? 'concluida' : String(findColumnValue(row, ['Status', 'status_coleta']) || '').toLowerCase() === 'agendada' ? 'agendada' : 'pendente'),
  type: (String(findColumnValue(row, ['Tipo', 'type']) || '').toLowerCase() === 'entrega' ? 'entrega' : 'coleta'),
  contrato: findColumnValue(row, ['Nr. Contrato', 'contrato']) || null,
  nf_glbl: findColumnValue(row, ['CONTRATO SANKHYA', 'nf_glbl']) || null,
  partner_code: findColumnValue(row, ['CÓD. PARC', 'partner_code']) || null,
});

const mapProductRow = (row: any): ProductImportData => ({
  code: String(findColumnValue(row, ['Código', 'code', 'Code']) || generateUniqueNumber('PROD')),
  description: findColumnValue(row, ['Descrição', 'description', 'Description', 'Nome', 'name', 'Name']) || null,
  model: findColumnValue(row, ['Modelo', 'model', 'Model', 'Categoria', 'category', 'Category']) || null,
  serial_number: findColumnValue(row, ['Número de Série', 'serial_number', 'Serial Number']) ? String(findColumnValue(row, ['Número de Série', 'serial_number', 'Serial Number'])) : null,
});

const mapClientRow = (row: any): ClientImportData => ({
  name: String(findColumnValue(row, ['Nome', 'Nome do Cliente', 'name', 'Client Name']) || '').trim(),
  phone: cleanPhoneNumber(findColumnValue(row, ['Telefone', 'phone', 'Phone Number'])),
  email: findColumnValue(row, ['Email', 'email', 'E-mail']) || null,
  address: findColumnValue(row, ['Endereço', 'address', 'Address']) || null,
  address_number: findColumnValue(row, ['Número do Endereço', 'address_number', 'Address Number']) ? String(findColumnValue(row, ['Número do Endereço', 'address_number', 'Address Number'])) : null,
  cep: findColumnValue(row, ['CEP', 'cep', 'ZIP Code']) ? String(findColumnValue(row, ['CEP', 'cep', 'ZIP Code'])) : null,
  cnpj: findColumnValue(row, ['CNPJ', 'cnpj']) ? String(findColumnValue(row, ['CNPJ', 'cnpj'])) : null,
  contact_person: findColumnValue(row, ['Pessoa de Contato', 'contact_person', 'Contact Person']) || null,
});

const mapTechnicianRow = (row: any): TechnicianImportData => {
  let firstName = String(findColumnValue(row, ['Primeiro Nome', 'first_name', 'Nome']) || '').trim();
  let lastName = String(findColumnValue(row, ['Sobrenome', 'last_name']) || '').trim();
  
  // If first_name and last_name are not found directly, try to parse from a combined name field
  if (!firstName && !lastName) {
    const fullName = String(findColumnValue(row, ['Técnico', 'Nome do Técnico', 'name', 'Name']) || '').trim();
    const nameParts = fullName.split(' ').filter(Boolean); // Filter out empty strings
    if (nameParts.length > 1) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else if (nameParts.length === 1) {
      firstName = nameParts[0];
    }
  }

  const email = findColumnValue(row, ['Email', 'email', 'E-mail']);
  const phoneNumber = cleanPhoneNumber(findColumnValue(row, ['Telefone', 'phone_number', 'Phone', 'Mobile']));
  let role: 'standard' | 'admin' | 'supervisor' = 'standard';
  const roleValue = String(findColumnValue(row, ['Função', 'role', 'Cargo']) || '').toLowerCase();
  if (roleValue === 'admin' || roleValue === 'administrador') {
    role = 'admin';
  } else if (roleValue === 'supervisor' || roleValue === 'supervisor técnico') {
    role = 'supervisor';
  }
  const supervisorId = findColumnValue(row, ['Supervisor ID', 'supervisor_id', 'ID Supervisor', 'Supervisor']);
  const address = findColumnValue(row, ['Endereço', 'address', 'Address']);

  // Ensure first_name is not empty, as it's crucial for user creation and profile
  if (!firstName) {
    console.warn("[DataImporter] Skipping technician row due to missing first_name:", row);
    return { first_name: '', email: null, role: 'standard', supervisor_id: null, address: null }; // Return minimal data to be filtered out
  }

  // Generate a default email if not provided, as email is mandatory for Supabase auth.admin.createUser
  const finalEmail = email ? String(email).trim() : 
    (firstName ? `${firstName.toLowerCase().replace(/\s/g, '.')}${lastName ? `.${lastName.toLowerCase().replace(/\s/g, '.')}` : ''}@logireverseia.com` : null);

  return {
    first_name: firstName,
    last_name: lastName || null,
    email: finalEmail, // Use the generated/provided email
    phone_number: phoneNumber,
    role: role,
    supervisor_id: supervisorId ? String(supervisorId).trim() : null,
    address: address ? String(address).trim() : null,
  };
};

// --- Public Parsing Functions ---

export const parseXLSX = async (file: File): Promise<ColetaImportData[]> => {
  const json = await readWorkbookToJson(file, 'array');
  return json.map(mapColetaRow);
};

export const parseCSV = async (file: File): Promise<ColetaImportData[]> => {
  const json = await readWorkbookToJson(file, 'string');
  return json.map(mapColetaRow);
};

// Função placeholder para simular a extração de dados de PDF
export const parsePDF = (file: File): Promise<ColetaImportData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dummyData: ColetaImportData[] = [
        {
          unique_number: generateUniqueNumber('PDF'),
          client_control: 'OS-PDF-001',
          parceiro: 'Cliente PDF Simulado',
          contato: '11987654321',
          telefone: cleanPhoneNumber('11987654321'),
          email: 'joao.silva@pdf.com',
          cnpj: '00.000.000/0001-00',
          endereco_origem: 'Rua da Amostra, Bairro Teste, Cidade Fictícia - SP',
          origin_address_number: '100',
          cep_origem: '01000-000',
          previsao_coleta: parseDateSafely(new Date()),
          qtd_aparelhos_solicitado: 3,
          modelo_aparelho: 'Equipamento PDF',
          freight_value: 75.00,
          observacao: `Dados extraídos de PDF (simulado) do arquivo: ${file.name}`,
          status_coleta: 'pendente',
          type: 'coleta',
          contrato: 'VMC10703/22',
          nf_glbl: '26192',
          partner_code: '53039',
        },
        {
          unique_number: generateUniqueNumber('PDF'),
          client_control: 'OS-PDF-002',
          parceiro: 'Outro Cliente PDF',
          contato: 'Maria Souza',
          telefone: cleanPhoneNumber('21912345678'),
          email: 'maria.souza@pdf.com',
          cnpj: '00.000.000/0002-00',
          endereco_origem: 'Av. Simulação, Centro, Rio de Janeiro - RJ',
          origin_address_number: '50',
          cep_origem: '20000-000',
          previsao_coleta: parseDateSafely(new Date()),
          qtd_aparelhos_solicitado: 1,
          modelo_aparelho: 'Componente PDF',
          freight_value: 25.00,
          observacao: `Dados extraídos de PDF (simulado) do arquivo: ${file.name}`,
          status_coleta: 'agendada',
          type: 'entrega',
          contrato: 'VMC10704/22',
          nf_glbl: '26193',
          partner_code: '53040',
        },
      ];
      resolve(dummyData);
    }, 1500);
  });
};

export const parseProductsXLSX = async (file: File): Promise<ProductImportData[]> => {
  const json = await readWorkbookToJson(file, 'array');
  return json.map(mapProductRow).filter(p => p.code);
};

export const parseProductsCSV = async (file: File): Promise<ProductImportData[]> => {
  const json = await readWorkbookToJson(file, 'string');
  return json.map(mapProductRow).filter(p => p.code);
};

export const parseProductsJSON = async (file: File): Promise<ProductImportData[]> => {
  const json = await readJsonFile(file);
  return json.map(mapProductRow).filter(p => p.code);
};

export const parseClientsXLSX = async (file: File): Promise<ClientImportData[]> => {
  const json = await readWorkbookToJson(file, 'array');
  return json.map(mapClientRow).filter(c => c.name);
};

export const parseClientsCSV = async (file: File): Promise<ClientImportData[]> => {
  const json = await readWorkbookToJson(file, 'string');
  return json.map(mapClientRow).filter(c => c.name);
};

export const parseClientsJSON = async (file: File): Promise<ClientImportData[]> => {
  const json = await readJsonFile(file);
  return json.map(mapClientRow).filter(c => c.name);
};

export const parseTechniciansXLSX = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readWorkbookToJson(file, 'array');
  return json.map(mapTechnicianRow).filter(t => t.first_name); // Filtra apenas por first_name
};

export const parseTechniciansCSV = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readWorkbookToJson(file, 'string');
  return json.map(mapTechnicianRow).filter(t => t.first_name); // Filtra apenas por first_name
};

export const parseTechniciansJSON = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readJsonFile(file);
  return json.map(mapTechnicianRow).filter(t => t.first_name); // Filtra apenas por first_name
};