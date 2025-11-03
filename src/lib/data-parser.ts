import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { generateUniqueNumber } from './utils';

// Define a estrutura esperada para os dados de coleta após a extração
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

// Função para ler dados de arquivos XLSX
export const parseXLSX = (file: File): Promise<ColetaImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: ColetaImportData[] = json.map((row: any) => ({
          unique_number: row['Número da Coleta'] || generateUniqueNumber('IMP'),
          client_control: row['Controle do Cliente'] || null,
          parceiro: row['Cliente'] || 'Cliente Desconhecido',
          contato: row['Contato'] || null,
          telefone: row['Telefone'] ? String(row['Telefone']) : null,
          email: row['Email'] || null,
          cnpj: row['CNPJ'] ? String(row['CNPJ']) : null,
          endereco_origem: row['Endereço de Origem'] || row['Endereço'] || 'Endereço Desconhecido',
          cep_origem: row['CEP de Origem'] ? String(row['CEP de Origem']) : null,
          endereco_destino: row['Endereço de Destino'] || null,
          cep_destino: row['CEP de Destino'] ? String(row['CEP de Destino']) : null,
          previsao_coleta: row['Data da Coleta'] ? format(new Date(row['Data da Coleta']), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          qtd_aparelhos_solicitado: parseInt(row['Quantidade']) || 1,
          modelo_aparelho: row['Produto'] || 'Produto Desconhecido',
          freight_value: parseFloat(row['Valor do Frete']) || null,
          observacao: row['Observações'] || null,
          status_coleta: (row['Status']?.toLowerCase() === 'concluida' ? 'concluida' : row['Status']?.toLowerCase() === 'agendada' ? 'agendada' : 'pendente'),
          type: (row['Tipo']?.toLowerCase() === 'entrega' ? 'entrega' : 'coleta'),
        }));
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo XLSX. Verifique o formato das colunas.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsArrayBuffer(file);
  });
};

// Função para ler dados de arquivos CSV
export const parseCSV = (file: File): Promise<ColetaImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const workbook = XLSX.read(csv, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: ColetaImportData[] = json.map((row: any) => ({
          unique_number: row['Número da Coleta'] || generateUniqueNumber('IMP'),
          client_control: row['Controle do Cliente'] || null,
          parceiro: row['Cliente'] || 'Cliente Desconhecido',
          contato: row['Contato'] || null,
          telefone: row['Telefone'] ? String(row['Telefone']) : null,
          email: row['Email'] || null,
          cnpj: row['CNPJ'] ? String(row['CNPJ']) : null,
          endereco_origem: row['Endereço de Origem'] || row['Endereço'] || 'Endereço Desconhecido',
          cep_origem: row['CEP de Origem'] ? String(row['CEP de Origem']) : null,
          endereco_destino: row['Endereço de Destino'] || null,
          cep_destino: row['CEP de Destino'] ? String(row['CEP de Destino']) : null,
          previsao_coleta: row['Data da Coleta'] ? format(new Date(row['Data da Coleta']), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          qtd_aparelhos_solicitado: parseInt(row['Quantidade']) || 1,
          modelo_aparelho: row['Produto'] || 'Produto Desconhecido',
          freight_value: parseFloat(row['Valor do Frete']) || null,
          observacao: row['Observações'] || null,
          status_coleta: (row['Status']?.toLowerCase() === 'concluida' ? 'concluida' : row['Status']?.toLowerCase() === 'agendada' ? 'agendada' : 'pendente'),
          type: (row['Tipo']?.toLowerCase() === 'entrega' ? 'entrega' : 'coleta'),
        }));
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo CSV. Verifique o formato das colunas.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

// Função placeholder para simular a extração de dados de PDF
export const parsePDF = (file: File): Promise<ColetaImportData[]> => {
  return new Promise((resolve, reject) => {
    // --- INÍCIO DA SIMULAÇÃO ---
    // Em um cenário real, você faria uma chamada a uma API externa de OCR aqui.
    // Exemplo de como seria a chamada (com um placeholder de URL e token):
    /*
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', 'YOUR_PDF_OCR_API_KEY'); // Substitua pela sua chave de API

    fetch('https://api.pdf.co/v1/pdf/convert/to/json', { // Exemplo com PDF.co
      method: 'POST',
      body: formData,
      headers: {
        'x-api-key': 'YOUR_PDF_OCR_API_KEY', // Ou outro cabeçalho de autenticação
      },
    })
    .then(response => response.json())
    .then(data => {
      // Processar o JSON retornado pela API e mapear para ColetaImportData
      const extractedData: ColetaImportData[] = [
        // Exemplo de mapeamento de dados fictícios
        {
          unique_number: 'NF-20250101-001',
          parceiro: 'Empresa Exemplo S.A.',
          endereco_origem: 'Rua Fictícia, 123, Centro, São Paulo - SP',
          previsao_coleta: '2025-01-15',
          qtd_aparelhos_solicitado: 5,
          modelo_aparelho: 'Smartphone Modelo X',
          freight_value: 120.50,
          status_coleta: 'pendente',
          type: 'coleta',
          observacao: 'Extraído de PDF (simulado)',
        },
      ];
      resolve(extractedData);
    })
    .catch(error => {
      console.error('Erro na API de OCR de PDF:', error);
      reject(new Error('Erro ao extrair dados do PDF. Verifique o arquivo ou a integração da API.'));
    });
    */

    // Para fins de demonstração, retornaremos dados fictícios após um pequeno atraso.
    setTimeout(() => {
      const dummyData: ColetaImportData[] = [
        {
          unique_number: generateUniqueNumber('PDF'),
          client_control: 'OS-PDF-001',
          parceiro: 'Cliente PDF Simulado',
          contato: '11987654321',
          telefone: '11987654321',
          email: 'joao.silva@pdf.com',
          cnpj: '00.000.000/0001-00',
          endereco_origem: 'Rua da Amostra, 100, Bairro Teste, Cidade Fictícia - SP',
          cep_origem: '01000-000',
          previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
          qtd_aparelhos_solicitado: 3,
          modelo_aparelho: 'Equipamento PDF',
          freight_value: 75.00,
          observacao: `Dados extraídos de PDF (simulado) do arquivo: ${file.name}`,
          status_coleta: 'pendente',
          type: 'coleta',
        },
        {
          unique_number: generateUniqueNumber('PDF'),
          client_control: 'OS-PDF-002',
          parceiro: 'Outro Cliente PDF',
          contato: 'Maria Souza',
          telefone: '21912345678',
          email: 'maria.souza@pdf.com',
          cnpj: '00.000.000/0002-00',
          endereco_origem: 'Av. Simulação, 50, Centro, Rio de Janeiro - RJ',
          cep_origem: '20000-000',
          previsao_coleta: format(new Date(), 'yyyy-MM-dd'),
          qtd_aparelhos_solicitado: 1,
          modelo_aparelho: 'Componente PDF',
          freight_value: 25.00,
          observacao: `Dados extraídos de PDF (simulado) do arquivo: ${file.name}`,
          status_coleta: 'agendada',
          type: 'entrega',
        },
      ];
      resolve(dummyData);
    }, 1500); // Simula um atraso de 1.5 segundos para a API
    // --- FIM DA SIMULAÇÃO ---
  });
};

export interface ProductImportData {
  code: string;
  description?: string | null;
  model?: string | null;
  serial_number?: string | null;
  // image_url is not typically imported via spreadsheet
}

// Function to read product data from XLSX files
export const parseProductsXLSX = (file: File): Promise<ProductImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: ProductImportData[] = json.map((row: any) => ({
          code: String(row['Código'] || row['code'] || generateUniqueNumber('PROD')), // Ensure code is always a string
          description: row['Descrição'] || row['description'] || row['Nome'] || row['name'] || null,
          model: row['Modelo'] || row['model'] || row['Categoria'] || null,
          serial_number: row['Número de Série'] ? String(row['Número de Série']) : null,
        })).filter(p => p.code); // Filter out rows without a valid code
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo XLSX para produtos. Verifique o formato das colunas.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsArrayBuffer(file);
  });
};

// Function to read product data from CSV files
export const parseProductsCSV = (file: File): Promise<ProductImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const workbook = XLSX.read(csv, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: ProductImportData[] = json.map((row: any) => ({
          code: String(row['Código'] || row['code'] || generateUniqueNumber('PROD')),
          description: row['Descrição'] || row['description'] || row['Nome'] || row['name'] || null,
          model: row['Modelo'] || row['model'] || row['Categoria'] || null,
          serial_number: row['Número de Série'] ? String(row['Número de Série']) : null,
        })).filter(p => p.code);
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo CSV para produtos. Verifique o formato das colunas.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

// Function to read product data from JSON files
export const parseProductsJSON = (file: File): Promise<ProductImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const json: any[] = JSON.parse(jsonString);

        const parsedData: ProductImportData[] = json.map((row: any) => ({
          code: String(row['code'] || row['Código'] || generateUniqueNumber('PROD')),
          description: row['description'] || row['Descrição'] || row['name'] || row['Nome'] || null,
          model: row['model'] || row['Modelo'] || row['category'] || row['Categoria'] || null,
          serial_number: row['serial_number'] ? String(row['serial_number']) : row['Número de Série'] ? String(row['Número de Série']) : null,
        })).filter(p => p.code);
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo JSON para produtos. Verifique o formato.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

// NEW: Define the expected structure for client data after extraction
export interface ClientImportData {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  cnpj?: string | null;
  contact_person?: string | null;
}

// NEW: Function to read client data from XLSX files
export const parseClientsXLSX = (file: File): Promise<ClientImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: ClientImportData[] = json.map((row: any) => ({
          name: String(row['Nome'] || row['Nome do Cliente'] || row['name'] || '').trim(), // Prioritize 'Nome', then 'Nome do Cliente', then 'name'
          phone: row['Telefone'] ? String(row['Telefone']) : null,
          email: row['Email'] || null,
          address: row['Endereço'] || null,
          cnpj: row['CNPJ'] ? String(row['CNPJ']) : null,
          contact_person: row['Pessoa de Contato'] || null,
        })); 
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo XLSX para clientes. Verifique o formato das colunas.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsArrayBuffer(file);
  });
};

// NEW: Function to read client data from CSV files
export const parseClientsCSV = (file: File): Promise<ClientImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const workbook = XLSX.read(csv, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: ClientImportData[] = json.map((row: any) => ({
          name: String(row['Nome'] || row['Nome do Cliente'] || row['name'] || '').trim(), // Prioritize 'Nome', then 'Nome do Cliente', then 'name'
          phone: row['Telefone'] ? String(row['Telefone']) : null,
          email: row['Email'] || null,
          address: row['Endereço'] || null,
          cnpj: row['CNPJ'] ? String(row['CNPJ']) : null,
          contact_person: row['Pessoa de Contato'] || null,
        })); 
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo CSV para clientes. Verifique o formato das colunas.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

// NEW: Function to read client data from JSON files
export const parseClientsJSON = (file: File): Promise<ClientImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const json: any[] = JSON.parse(jsonString);

        const parsedData: ClientImportData[] = json.map((row: any) => ({
          name: String(row['name'] || row['Nome do Cliente'] || row['Nome'] || '').trim(), // Prioritize 'name', then 'Nome do Cliente', then 'Nome'
          phone: row['phone'] ? String(row['phone']) : row['Telefone'] ? String(row['Telefone']) : null,
          email: row['email'] || null,
          address: row['address'] || row['Endereço'] || null,
          cnpj: row['cnpj'] ? String(row['cnpj']) : row['CNPJ'] ? String(row['CNPJ']) : null,
          contact_person: row['contact_person'] || row['Pessoa de Contato'] || null,
        })); 
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo JSON para clientes. Verifique o formato.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};