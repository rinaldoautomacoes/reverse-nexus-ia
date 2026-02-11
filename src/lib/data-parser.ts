import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { generateUniqueNumber } from './utils';
import { parseDateSafely } from './date-utils';
import { cleanPhoneNumber } from './document-parser';
import type { ColetaImportData, ProductImportData, ClientImportData, TechnicianImportData, SupervisorImportData } from './types';

// --- 1. Funções de Leitura de Arquivo Genéricas ---

const readXLSX = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo XLSX. Verifique o formato.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsArrayBuffer(file);
  });
};

const readCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const workbook = XLSX.read(csv, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo CSV. Verifique o formato.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

const readJSON = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const json: any[] = JSON.parse(jsonString);
        resolve(json);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo JSON. Verifique o formato.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

// --- 2. Funções de Mapeamento de Linha para Tipos de Dados ---

// Helper to validate if a string is a valid UUID format
const isUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const mapRowToColeta = (row: any): ColetaImportData => ({
  unique_number: row['Número da Coleta'] || generateUniqueNumber('IMP'),
  client_control: row['Controle do Cliente'] || null,
  parceiro: row['Cliente'] || 'Cliente Desconhecido',
  contato: row['Contato'] || null,
  telefone: cleanPhoneNumber(row['Telefone']),
  email: row['Email'] || null,
  cnpj: row['CNPJ'] ? String(row['CNPJ']) : null,
  endereco_origem: row['Endereço de Origem'] || row['Endereço'] || 'Endereço Desconhecido',
  cep_origem: row['CEP de Origem'] ? String(row['CEP de Origem']) : null,
  origin_address_number: row['Número Endereço Origem'] ? String(row['Número Endereço Origem']) : null,
  endereco_destino: row['Endereço de Destino'] || null,
  cep_destino: row['CEP de Destino'] ? String(row['CEP de Destino']) : null,
  destination_address_number: row['Número Endereço Destino'] ? String(row['Número Endereço Destino']) : null,
  previsao_coleta: parseDateSafely(row['Data da Coleta']),
  qtd_aparelhos_solicitado: parseInt(row['Quantidade']) || 1,
  modelo_aparelho: row['Produto'] || 'Produto Desconhecido',
  freight_value: parseFloat(row['Valor do Frete']) || null,
  status_coleta: (row['Status']?.toLowerCase() === 'concluida' ? 'concluida' : row['Status']?.toLowerCase() === 'agendada' ? 'agendada' : 'pendente'),
  type: (row['Tipo']?.toLowerCase() === 'entrega' ? 'entrega' : 'coleta'),
  observacao: row['Observações'] || null,
  contrato: row['Nr. Contrato'] || null,
  nf_glbl: row['CONTRATO SANKHYA'] || null,
  partner_code: row['CÓD. PARC'] || null,
});

const mapRowToProduct = (row: any): ProductImportData => ({
  code: String(row['Código'] || row['code'] || generateUniqueNumber('PROD')),
  description: row['Descrição'] || row['description'] || row['Nome'] || row['name'] || null,
  model: row['Modelo'] || row['model'] || row['Categoria'] || null,
  serial_number: row['Número de Série'] ? String(row['Número de Série']) : null,
});

const mapRowToClient = (row: any): ClientImportData => ({
  name: String(row['Nome'] || row['Nome do Cliente'] || row['name'] || '').trim(),
  phone: cleanPhoneNumber(row['Telefone']),
  email: row['Email'] || null,
  address: row['Endereço'] || null,
  address_number: row['Número do Endereço'] ? String(row['Número do Endereço']) : null,
  cep: row['CEP'] ? String(row['CEP']) : null,
  cnpj: row['CNPJ'] ? String(row['CNPJ']) : null,
  contact_person: row['Pessoa de Contato'] || null,
});

const mapRowToTechnician = (row: any): TechnicianImportData => {
  let firstName = String(row['Primeiro Nome'] || row['first_name'] || row['Nome'] || '').trim();
  let lastName = String(row['Sobrenome'] || row['last_name'] || '').trim();
  let phoneNumber = cleanPhoneNumber(row['Telefone da Empresa'] || row['phone_number']); // Ajustado para 'Telefone da Empresa'
  let personalPhoneNumber = cleanPhoneNumber(row['Telefone Pessoal'] || row['personal_phone_number']); // Novo campo
  let role = (row['Função']?.toLowerCase() === 'admin' ? 'admin' : 'standard');
  let supervisorIdRaw = row['ID Supervisor'] || row['supervisor_id'] || null;
  let supervisor_id: string | null = null;
  let teamShift: 'day' | 'night' = (row['Equipe']?.toLowerCase() === 'night' ? 'night' : 'day');
  let teamName: string | null = row['Nome da Equipe'] || row['team_name'] || null; // Novo campo
  let address: string | null = row['Endereço'] || null;

  if (row['Técnico'] && (!firstName || !lastName)) {
    const tecnicoFullName = String(row['Técnico']).trim();
    const nameParts = tecnicoFullName.split(' ').filter(Boolean);
    if (nameParts.length > 0) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
  }

  if (!firstName) firstName = 'Tecnico';
  if (!lastName) lastName = null;

  if (supervisorIdRaw && isUUID(String(supervisorIdRaw))) {
    supervisor_id = String(supervisorIdRaw);
  } else if (supervisorIdRaw) {
    console.warn(`[data-parser] Invalid supervisor_id format '${supervisorIdRaw}'. Setting to null.`);
  }

  const technicianData = {
    first_name: firstName,
    last_name: lastName,
    email: row['Email'] || null,
    phone_number: phoneNumber,
    personal_phone_number: personalPhoneNumber, // Incluído o novo campo
    role: role as 'admin' | 'standard',
    supervisor_id: supervisor_id,
    team_shift: teamShift,
    team_name: teamName, // Novo campo
    address: address,
  };
  return technicianData;
};

const mapRowToSupervisor = (row: any): SupervisorImportData => {
  let firstName = String(row['Primeiro Nome'] || row['first_name'] || row['Nome'] || '').trim();
  let lastName = String(row['Sobrenome'] || row['last_name'] || '').trim();
  let phoneNumber = cleanPhoneNumber(row['Telefone da Empresa'] || row['phone_number']); // Ajustado para 'Telefone da Empresa'
  let personalPhoneNumber = cleanPhoneNumber(row['Telefone Pessoal'] || row['personal_phone_number']); // Novo campo
  let role = (row['Função']?.toLowerCase() === 'admin' ? 'admin' : 'standard');
  let teamShift: 'day' | 'night' = (row['Equipe']?.toLowerCase() === 'night' ? 'night' : 'day');
  let teamName: string | null = row['Nome da Equipe'] || row['team_name'] || null; // Novo campo
  let address: string | null = row['Endereço'] || null;

  if (row['Supervisor'] && (!firstName || !lastName)) {
    const supervisorFullName = String(row['Supervisor']).trim();
    const nameParts = supervisorFullName.split(' ').filter(Boolean);
    if (nameParts.length > 0) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
  }

  if (!firstName) firstName = 'Supervisor';
  if (!lastName) lastName = null;

  const supervisorData = {
    first_name: firstName,
    last_name: lastName,
    email: row['Email'] || null,
    phone_number: phoneNumber,
    personal_phone_number: personalPhoneNumber, // Incluído o novo campo
    role: role as 'admin' | 'standard',
    team_shift: teamShift,
    team_name: teamName, // Novo campo
    address: address,
  };
  return supervisorData;
};

// --- 3. Funções de Parsing Principais (agora exportadas) ---

export const parseCollectionsXLSX = async (file: File): Promise<ColetaImportData[]> => {
  const json = await readXLSX(file);
  return json.map(mapRowToColeta);
};

export const parseCollectionsCSV = async (file: File): Promise<ColetaImportData[]> => {
  const json = await readCSV(file);
  return json.map(mapRowToColeta);
};

// Função placeholder para simular a extração de dados de PDF
export const parsePDF = (file: File): Promise<ColetaImportData[]> => {
  return new Promise((resolve, reject) => {
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
  const json = await readXLSX(file);
  return json.map(mapRowToProduct).filter(p => p.code && p.code.trim() !== '');
};

export const parseProductsCSV = async (file: File): Promise<ProductImportData[]> => {
  const json = await readCSV(file);
  return json.map(mapRowToProduct).filter(p => p.code && p.code.trim() !== '');
};

export const parseProductsJSON = async (file: File): Promise<ProductImportData[]> => {
  const json = await readJSON(file);
  return json.map(mapRowToProduct).filter(p => p.code && p.code.trim() !== '');
};

export const parseClientsXLSX = async (file: File): Promise<ClientImportData[]> => {
  const json = await readXLSX(file);
  return json.map(mapRowToClient).filter(c => c.name && c.name.trim() !== '');
};

export const parseClientsCSV = async (file: File): Promise<ClientImportData[]> => {
  const json = await readCSV(file);
  return json.map(mapRowToClient).filter(c => c.name && c.name.trim() !== '');
};

export const parseClientsJSON = async (file: File): Promise<ClientImportData[]> => {
  const json = await readJSON(file);
  return json.map(mapRowToClient).filter(c => c.name && c.name.trim() !== '');
};

export const parseTechniciansXLSX = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readXLSX(file);
  return json.map(mapRowToTechnician).filter(t => t.first_name);
};

export const parseTechniciansCSV = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readCSV(file);
  return json.map(mapRowToTechnician).filter(t => t.first_name);
};

export const parseTechniciansJSON = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readJSON(file);
  return json.map(mapRowToTechnician).filter(t => t.first_name);
};

export const parseSupervisorsXLSX = async (file: File): Promise<SupervisorImportData[]> => {
  const json = await readXLSX(file);
  return json.map(mapRowToSupervisor).filter(s => s.first_name);
};

export const parseSupervisorsCSV = async (file: File): Promise<SupervisorImportData[]> => {
  const json = await readCSV(file);
  return json.map(mapRowToSupervisor).filter(s => s.first_name);
};

export const parseSupervisorsJSON = async (file: File): Promise<SupervisorImportData[]> => {
  const json = await readJSON(file);
  return json.map(mapRowToSupervisor).filter(s => s.first_name);
};