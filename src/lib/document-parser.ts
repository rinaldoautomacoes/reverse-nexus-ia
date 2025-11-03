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
    items: [], // Inicializa vazio, será preenchido por regex ou por dados da planilha
    modelo_aparelho: null,
    modelo_aparelho_description: null,
  };

  let currentObservacao = [];
  let inItemsSection = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect start of item section (e.g., header "DESCRIÇÃO: QUANT. INST.")
    if (lowerLine.includes('descrição') && lowerLine.includes('quant. inst.')) {
      inItemsSection = true;
      continue; // Skip the header line itself
    }

    // If we are in the items section and haven't hit an end marker
    if (inItemsSection) {
      // Heuristic to detect end of item section
      if (
        lowerLine.startsWith('recolhimento:') ||
        lowerLine.startsWith('obs.:') ||
        lowerLine.startsWith('data do recolhimento:') ||
        lowerLine.startsWith('tecnico responsável:') ||
        lowerLine.startsWith('nr. contrato:') ||
        lowerLine.startsWith('cliente:')
      ) {
        inItemsSection = false; // End item capture
        // Continue to process this line as a non-item field
      } else {
        // Try to parse line as an item: [ITEM_NUMBER] [DESCRIPTION] [QUANTITY]
        const itemMatch = line.match(/^(\d+)\s+(.+?)\s+(\d+)$/);
        if (itemMatch) {
          const [, itemNumber, description, quantityStr] = itemMatch;
          const quantity = parseInt(quantityStr, 10);
          if (!isNaN(quantity) && quantity > 0) {
            parsedData.items?.push({
              product_code: description.trim(),
              product_description: description.trim(),
              quantity: quantity,
            });
          }
          continue; // Skip to next line if it was an item
        }
      }
    }

    // Parse general fields (only if not actively capturing a structured item line)
    const contatoMatch = line.match(/contato:\s*(.*)/i);
    if (contatoMatch && contatoMatch[1]) {
      parsedData.contato = contatoMatch[1].trim();
    } else if (lowerLine.startsWith('cliente:')) {
      parsedData.parceiro = line.replace(/cliente:/i, '').trim();
    } else if (lowerLine.startsWith('nome:')) {
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
    } else if (lowerLine.startsWith('data:')) {
      if (!parsedData.previsao_coleta) {
        const dateString = line.replace(/data:/i, '').trim();
        const parsedDate = parse(dateString, 'dd/MM/yy', new Date());
        if (isValid(parsedDate)) {
          parsedData.previsao_coleta = format(parsedDate, 'yyyy-MM-dd');
        }
      }
    } else if (lowerLine.startsWith('tecnico responsável:')) {
      parsedData.responsavel = line.replace(/tecnico responsável:/i, '').trim();
    } else if (lowerLine.startsWith('responsável no cliente:')) {
      if (!parsedData.contato) {
        parsedData.contato = line.replace(/responsável no cliente:/i, '').trim();
      }
    } else if (lowerLine.startsWith('recolhimento: imediato')) {
      currentObservacao.push('Recolhimento: IMEDIATO');
    } else if (lowerLine.startsWith('obs.:')) {
      currentObservacao.push(line.replace(/obs\.:/i, '').trim());
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

export const processSelectedSpreadsheetCellsForItems = (
  spreadsheetData: (string | number | null)[][],
  selectedCellKeys: string[]
): ParsedItem[] => {
  const itemRows: ParsedItem[] = [];
  const selectedCellMap = new Map<number, Map<number, string | number | null>>(); // Map<rowIndex, Map<colIndex, value>>

  selectedCellKeys.forEach(key => {
    const [rowIndexStr, colIndexStr] = key.split(':');
    const rowIndex = parseInt(rowIndexStr);
    const colIndex = parseInt(colIndexStr);
    if (!selectedCellMap.has(rowIndex)) {
      selectedCellMap.set(rowIndex, new Map());
    }
    selectedCellMap.get(rowIndex)?.set(colIndex, spreadsheetData[rowIndex]?.[colIndex]);
  });

  const sortedRowIndices = Array.from(selectedCellMap.keys()).sort((a, b) => a - b);

  let descCol: number | null = null;
  let quantCol: number | null = null;

  // Heuristic: Try to find header row first
  for (const rIndex of sortedRowIndices) {
    const row = selectedCellMap.get(rIndex);
    if (row) {
      for (const cIndex of Array.from(row.keys()).sort((a, b) => a - b)) { // Iterate columns in order
        const cellValue = String(row.get(cIndex) || '').toLowerCase();
        if (cellValue.includes('descrição')) {
          descCol = cIndex;
        }
        if (cellValue.includes('quant.') && cellValue.includes('inst.')) {
          quantCol = cIndex;
        }
      }
      if (descCol !== null && quantCol !== null) {
        // Found headers, assume data starts from this row or the next
        // For simplicity, we'll process all selected cells from this point onwards
        break; 
      }
    }
  }

  // If headers were found, process data from rows after the header row
  // If not, try to guess columns based on content type
  if (descCol !== null && quantCol !== null) {
    const headerRowIndex = sortedRowIndices.find(rIndex => {
      const row = selectedCellMap.get(rIndex);
      return row?.has(descCol) && String(row.get(descCol) || '').toLowerCase().includes('descrição');
    });

    const dataStartRowIndex = headerRowIndex !== undefined ? headerRowIndex + 1 : sortedRowIndices[0]; // Start from next row if header found, else first selected row

    for (const rIndex of sortedRowIndices) {
      if (rIndex < dataStartRowIndex) continue; // Skip header row and any rows before it

      const row = selectedCellMap.get(rIndex);
      if (row && row.has(descCol) && row.has(quantCol)) {
        const description = String(row.get(descCol) || '');
        const quantity = parseInt(String(row.get(quantCol)), 10);

        if (description.trim() !== '' && !isNaN(quantity) && quantity > 0) {
          itemRows.push({
            product_code: description.trim(),
            product_description: description.trim(), // Use description as code for now
            quantity: quantity,
          });
        }
      }
    }
  } else {
    // Fallback heuristic: if no clear headers, try to find two columns where one is mostly text and one is mostly numbers
    const columnData: Map<number, (string | number | null)[]> = new Map();
    sortedRowIndices.forEach(rIndex => {
      const row = selectedCellMap.get(rIndex);
      if (row) {
        row.forEach((value, cIndex) => {
          if (!columnData.has(cIndex)) columnData.set(cIndex, []);
          columnData.get(cIndex)?.push(value);
        });
      }
    });

    let bestDescCol: number | null = null;
    let bestQuantCol: number | null = null;
    let maxTextCount = -1;
    let maxNumCount = -1;

    Array.from(columnData.keys()).forEach(cIndex1 => {
      Array.from(columnData.keys()).forEach(cIndex2 => {
        if (cIndex1 === cIndex2) return;

        const col1 = columnData.get(cIndex1) || [];
        const col2 = columnData.get(cIndex2) || [];

        let textCount1 = 0;
        let numCount1 = 0;
        col1.forEach(val => {
          if (typeof val === 'string' && isNaN(Number(val))) textCount1++;
          else if (!isNaN(Number(val))) numCount1++;
        });

        let textCount2 = 0;
        let numCount2 = 0;
        col2.forEach(val => {
          if (typeof val === 'string' && isNaN(Number(val))) textCount2++;
          else if (!isNaN(Number(val))) numCount2++;
        });

        // Check if col1 is description-like and col2 is quantity-like
        if (textCount1 > maxTextCount && numCount2 > maxNumCount && textCount1 > numCount1 && numCount2 > textCount2) {
          maxTextCount = textCount1;
          maxNumCount = numCount2;
          bestDescCol = cIndex1;
          bestQuantCol = cIndex2;
        }
        // Check if col2 is description-like and col1 is quantity-like
        if (textCount2 > maxTextCount && numCount1 > maxNumCount && textCount2 > numCount2 && numCount1 > textCount1) {
          maxTextCount = textCount2;
          maxNumCount = numCount1;
          bestDescCol = cIndex2;
          bestQuantCol = cIndex1;
        }
      });
    });

    if (bestDescCol !== null && bestQuantCol !== null) {
      sortedRowIndices.forEach(rIndex => {
        const row = selectedCellMap.get(rIndex);
        if (row && row.has(bestDescCol) && row.has(bestQuantCol)) {
          const description = String(row.get(bestDescCol) || '');
          const quantity = parseInt(String(row.get(bestQuantCol)), 10);

          if (description.trim() !== '' && !isNaN(quantity) && quantity > 0) {
            itemRows.push({
              product_code: description.trim(),
              product_description: description.trim(),
              quantity: quantity,
            });
          }
        }
      });
    }
  }

  return itemRows;
};

export const parseSelectedSpreadsheetCells = (
  spreadsheetData: (string | number | null)[][],
  selectedCellKeys: string[]
): ParsedCollectionData => {
  const parsedData: Partial<ParsedCollectionData> = {
    unique_number: generateUniqueNumber('EXCEL'),
    status_coleta: 'pendente',
    type: 'coleta',
    items: [],
    previsao_coleta: format(new Date(), 'yyyy-MM-dd'), // Default date
  };

  const selectedCells: { rowIndex: number; colIndex: number; value: string | number | null }[] = [];
  selectedCellKeys.forEach(key => {
    const [rowIndexStr, colIndexStr] = key.split(':');
    const rowIndex = parseInt(rowIndexStr);
    const colIndex = parseInt(colIndexStr);
    selectedCells.push({ rowIndex, colIndex, value: spreadsheetData[rowIndex]?.[colIndex] });
  });

  // Sort cells by row, then by column to process them somewhat linearly
  selectedCells.sort((a, b) => {
    if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
    return a.colIndex - b.colIndex;
  });

  // Heuristics to extract data
  for (const cell of selectedCells) {
    const cellValue = String(cell.value || '').trim();
    const lowerCellValue = cellValue.toLowerCase();

    // Helper to get value from current cell or adjacent cell
    const getValue = (currentCell: typeof cell, checkAdjacent = true) => {
      const valueFromCurrent = currentCell.value ? String(currentCell.value).trim() : '';
      if (valueFromCurrent && !valueFromCurrent.includes(':')) return valueFromCurrent; // If it's just a value, use it

      const parts = valueFromCurrent.split(':');
      if (parts.length > 1 && parts[0].toLowerCase().includes(lowerCellValue.split(':')[0])) {
        return parts.slice(1).join(':').trim(); // Value after label
      }

      if (checkAdjacent && currentCell.colIndex + 1 < spreadsheetData[currentCell.rowIndex]?.length) {
        return String(spreadsheetData[currentCell.rowIndex][currentCell.colIndex + 1] || '').trim();
      }
      return '';
    };

    // Client Name
    if (lowerCellValue.includes('cliente') || lowerCellValue.includes('nome do cliente') || lowerCellValue.includes('parceiro')) {
      const value = getValue(cell);
      if (value) parsedData.parceiro = value;
    }

    // Address & CEP
    if (lowerCellValue.includes('endereço de origem') || lowerCellValue.includes('endereço') || lowerCellValue.includes('address')) {
      const value = getValue(cell);
      if (value) parsedData.endereco_origem = value;
      const cepMatch = (parsedData.endereco_origem || value).match(/(\d{5}-?\d{3})/);
      if (cepMatch) parsedData.cep_origem = cepMatch[1].replace(/-/g, '');
    } else if (lowerCellValue.includes('cep de origem') || lowerCellValue.includes('cep')) {
      const value = getValue(cell);
      if (value) parsedData.cep_origem = value.replace(/-/g, '');
    }
    // Destination Address & CEP (assuming similar patterns if present)
    if (lowerCellValue.includes('endereço de destino')) {
      const value = getValue(cell);
      if (value) parsedData.endereco_destino = value;
      const cepMatch = (parsedData.endereco_destino || value).match(/(\d{5}-?\d{3})/);
      if (cepMatch) parsedData.cep_destino = cepMatch[1].replace(/-/g, '');
    } else if (lowerCellValue.includes('cep de destino')) {
      const value = getValue(cell);
      if (value) parsedData.cep_destino = value.replace(/-/g, '');
    }

    // Contact Person
    if (lowerCellValue.includes('contato') || lowerCellValue.includes('pessoa de contato')) {
      const value = getValue(cell);
      if (value) parsedData.contato = value;
    }

    // Phone
    if (lowerCellValue.includes('telefone') || lowerCellValue.includes('phone')) {
      const value = getValue(cell);
      if (value) parsedData.telefone = value;
    }

    // Email
    if (lowerCellValue.includes('email')) {
      const value = getValue(cell);
      if (value) parsedData.email = value;
    }

    // CNPJ
    if (lowerCellValue.includes('cnpj')) {
      const value = getValue(cell);
      if (value) parsedData.cnpj = value;
    }

    // Date
    if (lowerCellValue.includes('data') || lowerCellValue.includes('previsão') || lowerCellValue.includes('data da coleta') || lowerCellValue.includes('data da entrega')) {
      let dateString = getValue(cell);
      if (dateString) {
        const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date()); // Try common format
        if (isValid(parsedDate)) {
          parsedData.previsao_coleta = format(parsedDate, 'yyyy-MM-dd');
        } else {
          const parsedDateAlt = parse(dateString, 'yyyy-MM-dd', new Date()); // Try another common format
          if (isValid(parsedDateAlt)) {
            parsedData.previsao_coleta = format(parsedDateAlt, 'yyyy-MM-dd');
          }
        }
      }
    }

    // Unique Number / Client Control
    if (lowerCellValue.includes('número da coleta') || lowerCellValue.includes('os') || lowerCellValue.includes('pedido') || lowerCellValue.includes('unique number')) {
      const value = getValue(cell);
      if (value) parsedData.unique_number = value;
    } else if (lowerCellValue.includes('controle do cliente') || lowerCellValue.includes('client control')) {
      const value = getValue(cell);
      if (value) parsedData.client_control = value;
    }
    
    // Responsible
    if (lowerCellValue.includes('responsável') || lowerCellValue.includes('tecnico responsável')) {
      const value = getValue(cell);
      if (value) parsedData.responsavel = value;
    }

    // Observation
    if (lowerCellValue.includes('observação') || lowerCellValue.includes('obs')) {
      const value = getValue(cell);
      if (value) parsedData.observacao = value;
    }

    // Contract
    if (lowerCellValue.includes('contrato')) {
      const value = getValue(cell);
      if (value) parsedData.contrato = value;
    }
  }

  // Extract items using the existing function
  parsedData.items = processSelectedSpreadsheetCellsForItems(spreadsheetData, selectedCellKeys);

  // Fallbacks for required fields
  parsedData.parceiro = parsedData.parceiro || 'Cliente Desconhecido';
  parsedData.endereco_origem = parsedData.endereco_origem || 'Endereço Desconhecido';
  parsedData.previsao_coleta = parsedData.previsao_coleta || format(new Date(), 'yyyy-MM-dd');
  parsedData.items = parsedData.items || [];

  // Populate main product fields from the first item if available
  if (parsedData.items.length > 0) {
    parsedData.modelo_aparelho = parsedData.items[0].product_code;
    parsedData.modelo_aparelho_description = parsedData.items[0].product_description;
  } else {
    parsedData.modelo_aparelho = null;
    parsedData.modelo_aparelho_description = null;
  }

  return parsedData as ParsedCollectionData;
};