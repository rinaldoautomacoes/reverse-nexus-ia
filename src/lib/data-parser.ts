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
          telefone: cleanPhoneNumber(row['Telefone']), // Aplicado cleanPhoneNumber
          email: row['Email'] || null,
          cnpj: row['CNPJ'] ? String(row['CNPJ']) : null,
          endereco_origem: row['Endereço de Origem'] || row['Endereço'] || 'Endereço Desconhecido',
          cep_origem: row['CEP de Origem'] ? String(row['CEP de Origem']) : null,
          origin_address_number: row['Número Endereço Origem'] ? String(row['Número Endereço Origem']) : null, // Novo campo
          endereco_destino: row['Endereço de Destino'] || null,
          cep_destino: row['CEP de Destino'] ? String(row['CEP de Destino']) : null,
          destination_address_number: row['Número Endereço Destino'] ? String(row['Número Endereço Destino']) : null, // Novo campo
          previsao_coleta: parseDateSafely(row['Data da Coleta']),
          qtd_aparelhos_solicitado: parseInt(row['Quantidade']) || 1,
          modelo_aparelho: row['Produto'] || 'Produto Desconhecido',
          freight_value: parseFloat(row['Valor do Frete']) || null,
          observacao: row['Observações'] || null,
          status_coleta: (row['Status']?.toLowerCase() === 'concluida' ? 'concluida' : row['Status']?.toLowerCase() === 'agendada' ? 'agendada' : 'pendente'),
          type: (row['Tipo']?.toLowerCase() === 'entrega' ? 'entrega' : 'coleta'),
          contrato: row['Nr. Contrato'] || null, // Novo campo
          nf_glbl: row['CONTRATO SANKHYA'] || null, // Novo campo
          partner_code: row['CÓD. PARC'] || null, // Novo campo
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
          telefone: cleanPhoneNumber(row['Telefone']), // Aplicado cleanPhoneNumber
          email: row['Email'] || null,
          cnpj: row['CNPJ'] ? String(row['CNPJ']) : null,
          endereco_origem: row['Endereço de Origem'] || row['Endereço'] || 'Endereço Desconhecido',
          cep_origem: row['CEP de Origem'] ? String(row['CEP de Origem']) : null,
          origin_address_number: row['Número Endereço Origem'] ? String(row['Número Endereço Origem']) : null, // Novo campo
          endereco_destino: row['Endereço de Destino'] || null,
          cep_destino: row['CEP de Destino'] ? String(row['CEP de Destino']) : null,
          destination_address_number: row['Número Endereço Destino'] ? String(row['Número Endereço Destino']) : null, // Novo campo
          previsao_coleta: parseDateSafely(row['Data da Coleta']),
          qtd_aparelhos_solicitado: parseInt(row['Quantidade']) || 1,
          modelo_aparelho: row['Produto'] || 'Produto Desconhecido',
          freight_value: parseFloat(row['Valor do Frete']) || null,
          observacao: row['Observações'] || null,
          status_coleta: (row['Status']?.toLowerCase() === 'concluida' ? 'concluida' : row['Status']?.toLowerCase() === 'agendada' ? 'agendada' : 'pendente'),
          type: (row['Tipo']?.toLowerCase() === 'entrega' ? 'entrega' : 'coleta'),
          contrato: row['Nr. Contrato'] || null, // Novo campo
          nf_glbl: row['CONTRATO SANKHYA'] || null, // Novo campo
          partner_code: row['CÓD.. PARC'] || null, // Novo campo
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
    setTimeout(() => {
      const dummyData: ColetaImportData[] = [
        {
          unique_number: generateUniqueNumber('PDF'),
          client_control: 'OS-PDF-001',
          parceiro: 'Cliente PDF Simulado',
          contato: '11987654321',
          telefone: cleanPhoneNumber('11987654321'), // Aplicado cleanPhoneNumber
          email: 'joao.silva@pdf.com',
          cnpj: '00.000.000/0001-00',
          endereco_origem: 'Rua da Amostra, Bairro Teste, Cidade Fictícia - SP',
          origin_address_number: '100', // Novo campo
          cep_origem: '01000-000',
          previsao_coleta: parseDateSafely(new Date()),
          qtd_aparelhos_solicitado: 3,
          modelo_aparelho: 'Equipamento PDF',
          freight_value: 75.00,
          observacao: `Dados extraídos de PDF (simulado) do arquivo: ${file.name}`,
          status_coleta: 'pendente',
          type: 'coleta',
          contrato: 'VMC10703/22', // Novo campo
          nf_glbl: '26192', // Novo campo
          partner_code: '53039', // Novo campo
        },
        {
          unique_number: generateUniqueNumber('PDF'),
          client_control: 'OS-PDF-002',
          parceiro: 'Outro Cliente PDF',
          contato: 'Maria Souza',
          telefone: cleanPhoneNumber('21912345678'), // Aplicado cleanPhoneNumber
          email: 'maria.souza@pdf.com',
          cnpj: '00.000.000/0002-00',
          endereco_origem: 'Av. Simulação, Centro, Rio de Janeiro - RJ',
          origin_address_number: '50', // Novo campo
          cep_origem: '20000-000',
          previsao_coleta: parseDateSafely(new Date()),
          qtd_aparelhos_solicitado: 1,
          modelo_aparelho: 'Componente PDF',
          freight_value: 25.00,
          observacao: `Dados extraídos de PDF (simulado) do arquivo: ${file.name}`,
          status_coleta: 'agendada',
          type: 'entrega',
          contrato: 'VMC10704/22', // Novo campo
          nf_glbl: '26193', // Novo campo
          partner_code: '53040', // Novo campo
        },
      ];
      resolve(dummyData);
    }, 1500);
  });
};

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
          code: String(findColumnValue(row, ['Código', 'code', 'Code']) || generateUniqueNumber('PROD')),
          description: findColumnValue(row, ['Descrição', 'description', 'Description', 'Nome', 'name', 'Name']) || null,
          model: findColumnValue(row, ['Modelo', 'model', 'Model', 'Categoria', 'category', 'Category']) || null,
          serial_number: findColumnValue(row, ['Número de Série', 'serial_number', 'Serial Number']) ? String(findColumnValue(row, ['Número de Série', 'serial_number', 'Serial Number'])) : null,
        })).filter(p => p.code);
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
          code: String(findColumnValue(row, ['Código', 'code', 'Code']) || generateUniqueNumber('PROD')),
          description: findColumnValue(row, ['Descrição', 'description', 'Description', 'Nome', 'name', 'Name']) || null,
          model: findColumnValue(row, ['Modelo', 'model', 'Model', 'Categoria', 'category', 'Category']) || null,
          serial_number: findColumnValue(row, ['Número de Série', 'serial_number', 'Serial Number']) ? String(findColumnValue(row, ['Número de Série', 'serial_number', 'Serial Number'])) : null,
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
          code: String(findColumnValue(row, ['code', 'Código', 'Code']) || generateUniqueNumber('PROD')),
          description: findColumnValue(row, ['description', 'Descrição', 'Description', 'name', 'Nome', 'Name']) || null,
          model: findColumnValue(row, ['model', 'Modelo', 'Model', 'category', 'Categoria', 'Category']) || null,
          serial_number: findColumnValue(row, ['serial_number', 'Número de Série', 'Serial Number']) ? String(findColumnValue(row, ['serial_number', 'Número de Série', 'Serial Number'])) : null,
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
          name: String(findColumnValue(row, ['Nome', 'Nome do Cliente', 'name', 'Client Name']) || '').trim(),
          phone: cleanPhoneNumber(findColumnValue(row, ['Telefone', 'phone', 'Phone Number'])), // Aplicado cleanPhoneNumber
          email: findColumnValue(row, ['Email', 'email', 'E-mail']) || null,
          address: findColumnValue(row, ['Endereço', 'address', 'Address']) || null,
          address_number: findColumnValue(row, ['Número do Endereço', 'address_number', 'Address Number']) ? String(findColumnValue(row, ['Número do Endereço', 'address_number', 'Address Number'])) : null, // Novo campo
          cep: findColumnValue(row, ['CEP', 'cep', 'ZIP Code']) ? String(findColumnValue(row, ['CEP', 'cep', 'ZIP Code'])) : null, // Novo campo
          cnpj: findColumnValue(row, ['CNPJ', 'cnpj']) ? String(findColumnValue(row, ['CNPJ', 'cnpj'])) : null,
          contact_person: findColumnValue(row, ['Pessoa de Contato', 'contact_person', 'Contact Person']) || null,
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
          name: String(findColumnValue(row, ['Nome', 'Nome do Cliente', 'name', 'Client Name']) || '').trim(),
          phone: cleanPhoneNumber(findColumnValue(row, ['Telefone', 'phone', 'Phone Number'])), // Aplicado cleanPhoneNumber
          email: findColumnValue(row, ['Email', 'email', 'E-mail']) || null,
          address: findColumnValue(row, ['Endereço', 'address', 'Address']) || null,
          address_number: findColumnValue(row, ['Número do Endereço', 'address_number', 'Address Number']) ? String(findColumnValue(row, ['Número do Endereço', 'address_number', 'Address Number'])) : null, // Novo campo
          cep: findColumnValue(row, ['CEP', 'cep', 'ZIP Code']) ? String(findColumnValue(row, ['CEP', 'cep', 'ZIP Code'])) : null, // Novo campo
          cnpj: findColumnValue(row, ['CNPJ', 'cnpj']) ? String(findColumnValue(row, ['CNPJ', 'cnpj'])) : null,
          contact_person: findColumnValue(row, ['Pessoa de Contato', 'contact_person', 'Contact Person']) || null,
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
          name: String(findColumnValue(row, ['name', 'Nome do Cliente', 'Nome', 'Client Name']) || '').trim(),
          phone: cleanPhoneNumber(findColumnValue(row, ['phone', 'Telefone', 'Phone Number'])), // Aplicado cleanPhoneNumber
          email: findColumnValue(row, ['email', 'Email', 'E-mail']) || null,
          address: findColumnValue(row, ['address', 'Endereço', 'Address']) || null,
          address_number: findColumnValue(row, ['address_number', 'Número do Endereço', 'Address Number']) ? String(findColumnValue(row, ['address_number', 'Número do Endereço', 'Address Number'])) : null, // Novo campo
          cep: findColumnValue(row, ['cep', 'CEP', 'ZIP Code']) ? String(findColumnValue(row, ['cep', 'CEP', 'ZIP Code'])) : null, // Novo campo
          cnpj: findColumnValue(row, ['cnpj', 'CNPJ']) ? String(findColumnValue(row, ['cnpj', 'CNPJ'])) : null,
          contact_person: findColumnValue(row, ['contact_person', 'Pessoa de Contato', 'Contact Person']) || null,
        })); 
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo JSON para produtos. Verifique o formato.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

// NEW: Function to read technician data from XLSX files
export const parseTechniciansXLSX = (file: File): Promise<TechnicianImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: TechnicianImportData[] = json.map((row: any) => {
          let firstName = String(findColumnValue(row, ['Primeiro Nome', 'first_name', 'Nome']) || '').trim();
          let lastName = String(findColumnValue(row, ['Sobrenome', 'last_name']) || '').trim();
          
          // Se não encontrou primeiro/último nome, tenta a coluna 'Técnico' e divide
          if (!firstName && !lastName) {
            const fullName = String(findColumnValue(row, ['Técnico', 'Nome do Técnico']) || '').trim();
            const nameParts = fullName.split(' ');
            if (nameParts.length > 1) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              firstName = fullName;
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
          const address = findColumnValue(row, ['Endereço', 'address', 'Address']); // Novo campo

          return {
            first_name: firstName || null,
            last_name: lastName || null,
            email: email ? String(email).trim() : null,
            phone_number: phoneNumber,
            role: role,
            supervisor_id: supervisorId ? String(supervisorId).trim() : null,
            address: address ? String(address).trim() : null, // Novo campo
          };
        }).filter(t => t.first_name); // Apenas filtra por first_name, email pode ser null aqui
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo XLSX para técnicos. Verifique o formato das colunas.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsArrayBuffer(file);
  });
};

// NEW: Function to read technician data from CSV files
export const parseTechniciansCSV = (file: File): Promise<TechnicianImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const workbook = XLSX.read(csv, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: TechnicianImportData[] = json.map((row: any) => {
          let firstName = String(findColumnValue(row, ['Primeiro Nome', 'first_name', 'Nome']) || '').trim();
          let lastName = String(findColumnValue(row, ['Sobrenome', 'last_name']) || '').trim();
          
          // Se não encontrou primeiro/último nome, tenta a coluna 'Técnico' e divide
          if (!firstName && !lastName) {
            const fullName = String(findColumnValue(row, ['Técnico', 'Nome do Técnico']) || '').trim();
            const nameParts = fullName.split(' ');
            if (nameParts.length > 1) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              firstName = fullName;
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
          const address = findColumnValue(row, ['Endereço', 'address', 'Address']); // Novo campo

          return {
            first_name: firstName || null,
            last_name: lastName || null,
            email: email ? String(email).trim() : null,
            phone_number: phoneNumber,
            role: role,
            supervisor_id: supervisorId ? String(supervisorId).trim() : null,
            address: address ? String(address).trim() : null, // Novo campo
          };
        }).filter(t => t.first_name); // Apenas filtra por first_name, email pode ser null aqui
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo CSV para técnicos. Verifique o formato das colunas.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};

// NEW: Function to read technician data from JSON files
export const parseTechniciansJSON = (file: File): Promise<TechnicianImportData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const json: any[] = JSON.parse(jsonString);

        const parsedData: TechnicianImportData[] = json.map((row: any) => {
          let firstName = String(findColumnValue(row, ['first_name', 'Primeiro Nome', 'Nome']) || '').trim();
          let lastName = String(findColumnValue(row, ['last_name', 'Sobrenome']) || '').trim();
          
          // Se não encontrou primeiro/último nome, tenta a coluna 'Técnico' e divide
          if (!firstName && !lastName) {
            const fullName = String(findColumnValue(row, ['Técnico', 'Nome do Técnico']) || '').trim();
            const nameParts = fullName.split(' ');
            if (nameParts.length > 1) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              firstName = fullName;
            }
          }

          const email = findColumnValue(row, ['email', 'Email', 'E-mail']);
          const phoneNumber = cleanPhoneNumber(findColumnValue(row, ['phone_number', 'Telefone', 'Phone', 'Mobile']));
          let role: 'standard' | 'admin' | 'supervisor' = 'standard';
          const roleValue = String(findColumnValue(row, ['role', 'Função', 'Cargo']) || '').toLowerCase();
          if (roleValue === 'admin' || roleValue === 'administrador') {
            role = 'admin';
          } else if (roleValue === 'supervisor' || roleValue === 'supervisor técnico') {
            role = 'supervisor';
          }
          const supervisorId = findColumnValue(row, ['supervisor_id', 'Supervisor ID', 'ID Supervisor', 'Supervisor']);
          const address = findColumnValue(row, ['address', 'Endereço', 'Address']); // Novo campo

          return {
            first_name: firstName || null,
            last_name: lastName || null,
            email: email ? String(email).trim() : null,
            phone_number: phoneNumber,
            role: role,
            supervisor_id: supervisorId ? String(supervisorId).trim() : null,
            address: address ? String(address).trim() : null, // Novo campo
          };
        }).filter(t => t.first_name); // Apenas filtra por first_name, email pode ser null aqui
        resolve(parsedData);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo JSON para técnicos. Verifique o formato.'));
      }
    };
    reader.onerror = (error) => reject(new Error('Erro ao ler arquivo: ' + error));
    reader.readAsText(file);
  });
};