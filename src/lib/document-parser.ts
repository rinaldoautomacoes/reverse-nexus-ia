import { format, parse, isValid } from 'date-fns';
import { generateUniqueNumber } from './utils';

export interface ParsedItem {
  product_code: string; // Novo: para o código do produto do item
  product_description: string; // Novo: para a descrição do produto do item
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
  endereco_destino?: string | null; // Documento não especifica, mas pode ser útil
  cep_destino?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  previsao_coleta: string; // Formato 'yyyy-MM-dd'
  observacao?: string | null;
  responsavel?: string | null; // Técnico Responsável
  status_coleta: 'pendente' | 'agendada' | 'concluida';
  type: 'coleta' | 'entrega';
  items: ParsedItem[]; // Array de itens
  contrato?: string | null; // Added missing field from previous parsing
  // Novos campos para o produto principal da coleta, derivados do primeiro item ou de um resumo
  modelo_aparelho?: string | null; // Código do produto principal (mapeia para coletas.modelo_aparelho)
  modelo_aparelho_description?: string | null; // Descrição do produto principal (mapeia para coletas.modelo_aparelho_description)
}

export const parseReturnDocumentText = (text: string): ParsedCollectionData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const parsedData: Partial<ParsedCollectionData> = {
    unique_number: generateUniqueNumber('DOC'),
    status_coleta: 'pendente',
    type: 'coleta',
    items: [],
    modelo_aparelho: null, // Inicializa novos campos
    modelo_aparelho_description: null, // Inicializa novos campos
  };

  let currentObservacao = [];
  let descriptionsBuffer: string[] = [];
  let quantitiesBuffer: string[] = [];
  
  let isCapturingDescriptions = false;
  let isCapturingQuantities = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect start of description section
    if (lowerLine.includes('descrição') && lowerLine.includes('quant. inst.')) {
      isCapturingDescriptions = true;
      isCapturingQuantities = false; // Ensure only one capture mode is active
      continue; // Skip the header line itself
    }

    // Detect start of quantity section (assuming it comes after descriptions)
    if (lowerLine.includes('quant. inst.') && !lowerLine.includes('descrição')) {
      isCapturingQuantities = true;
      isCapturingDescriptions = false; // Stop capturing descriptions
      continue; // Skip the header line itself
    }

    // Detect end of item sections (descriptions or quantities)
    // This is a heuristic, adjust if other markers are more appropriate
    if (
      lowerLine.startsWith('recolhimento:') ||
      lowerLine.startsWith('obs.:') ||
      lowerLine.startsWith('data do recolhimento:') ||
      lowerLine.startsWith('tecnico responsável:') ||
      lowerLine.startsWith('nr. contrato:') ||
      lowerLine.startsWith('cliente:') // Also stop if a new client section starts
    ) {
      isCapturingDescriptions = false;
      isCapturingQuantities = false;
    }

    if (isCapturingDescriptions) {
      // Collect lines that look like descriptions (not empty, not just numbers)
      if (line.length > 0 && !/^\d+$/.test(line)) {
        descriptionsBuffer.push(line);
      }
    } else if (isCapturingQuantities) {
      // Collect lines that look like quantities (just numbers)
      if (/^\d+$/.test(line)) {
        quantitiesBuffer.push(line);
      }
    } else {
      // Parse general fields (only if not in item capture mode)
      // Prioritize direct 'Contato:' field
      const contatoMatch = line.match(/contato:\s*(.*)/i);
      if (contatoMatch && contatoMatch[1]) {
        parsedData.contato = contatoMatch[1].trim();
      } else if (lowerLine.startsWith('cliente:')) {
        parsedData.parceiro = line.replace(/cliente:/i, '').trim();
      } else if (lowerLine.startsWith('nome:')) {
        // Prioritize 'cliente:' if both exist, otherwise use 'nome:'
        if (!parsedData.parceiro) {
          parsedData.parceiro = line.replace(/nome:/i, '').trim();
        }
      } else if (lowerLine.startsWith('cód. parc:')) {
        parsedData.client_control = line.replace(/cód\. parc:/i, '').trim();
      } else if (lowerLine.startsWith('contrato sankhya:')) {
        currentObservacao.push(`Contrato Sankhya: ${line.replace(/contrato sankhya:/i, '').trim()}`);
      } else if (lowerLine.startsWith('nr. contrato:')) {
        parsedData.contrato = line.replace(/nr\. contrato:/i, '').trim();
      } else if (lowerLine.startsWith('endereço:')) {
        const addressText = line.replace(/endereço:/i, '').trim();
        parsedData.endereco_origem = addressText;
        const cepMatch = addressText.match(/cep:(\d{2}\.\d{3}-\d{3}|\d{8})/i);
        if (cepMatch) {
          parsedData.cep_origem = cepMatch[1].replace(/\D/g, '');
        }
      } else if (lowerLine.includes('telefones:')) {
        const phoneMatch = line.match(/phone:\s*(\+?\d[\d\s\-\(\)]+)/i);
        const mobileMatch = line.match(/mobile:\s*(\+?\d[\d\s\-\(\)]+)/i);
        let phones = [];
        if (phoneMatch) phones.push(phoneMatch[1].trim());
        if (mobileMatch) phones.push(mobileMatch[1].trim());
        parsedData.telefone = phones.join(' / ');
      } else if (lowerLine.startsWith('email:')) {
        parsedData.email = line.replace(/email:/i, '').trim();
      } else if (lowerLine.startsWith('data do recolhimento:')) {
        const dateString = line.replace(/data do recolhimento:/i, '').trim();
        const parsedDate = parse(dateString, 'dd/MM/yy', new Date());
        if (isValid(parsedDate)) {
          parsedData.previsao_coleta = format(parsedDate, 'yyyy-MM-dd');
        }
      } else if (lowerLine.startsWith('data:')) { // Generic date, lower priority
        if (!parsedData.previsao_coleta) { // Only set if not already set by 'data do recolhimento'
          const dateString = line.replace(/data:/i, '').trim();
          const parsedDate = parse(dateString, 'dd/MM/yy', new Date());
          if (isValid(parsedDate)) {
            parsedData.previsao_coleta = format(parsedDate, 'yyyy-MM-dd');
          }
        }
      } else if (lowerLine.startsWith('tecnico responsável:')) {
        parsedData.responsavel = line.replace(/tecnico responsável:/i, '').trim();
      } else if (lowerLine.startsWith('responsável no cliente:')) {
        // Only set if 'contato' was not already set by a direct 'Contato:' line
        if (!parsedData.contato) {
          parsedData.contato = line.replace(/responsável no cliente:/i, '').trim();
        }
      } else if (lowerLine.startsWith('recolhimento: imediato')) {
        currentObservacao.push('Recolhimento: IMEDIATO');
      } else if (lowerLine.startsWith('obs.:')) {
        currentObservacao.push(line.replace(/obs\.:/i, '').trim());
      }
    }
  }

  // After collecting all descriptions and quantities, pair them up
  const minLength = Math.min(descriptionsBuffer.length, quantitiesBuffer.length);
  for (let i = 0; i < minLength; i++) {
    const description = descriptionsBuffer[i];
    const quantity = parseInt(quantitiesBuffer[i], 10);
    if (!isNaN(quantity) && quantity > 0) {
      parsedData.items?.push({
        product_code: description, // Por enquanto, o código é o mesmo da descrição
        product_description: description,
        quantity: quantity,
      });
    }
  }

  if (currentObservacao.length > 0) {
    parsedData.observacao = (parsedData.observacao ? parsedData.observacao + '\n' : '') + currentObservacao.join('\n');
  }

  // Fallbacks for required fields
  parsedData.parceiro = parsedData.parceiro || 'Cliente Desconhecido';
  parsedData.endereco_origem = parsedData.endereco_origem || 'Endereço Desconhecido';
  parsedData.previsao_coleta = parsedData.previsao_coleta || format(new Date(), 'yyyy-MM-dd');
  parsedData.items = parsedData.items || [];

  // Popula os campos do produto principal a partir do primeiro item, se houver
  if (parsedData.items.length > 0) {
    parsedData.modelo_aparelho = parsedData.items[0].product_code;
    parsedData.modelo_aparelho_description = parsedData.items[0].product_description;
  } else {
    parsedData.modelo_aparelho = null;
    parsedData.modelo_aparelho_description = null;
  }

  return parsedData as ParsedCollectionData;
};