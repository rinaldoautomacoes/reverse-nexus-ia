import { generateUniqueNumber } from './utils';
import { parseDateSafely } from './date-utils';
import type { ParsedItem, ParsedCollectionData } from './types';

// Helper function to clean phone numbers, keeping only digits
export const cleanPhoneNumber = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, ''); // Remove all non-digit characters
  return cleaned.length > 0 ? cleaned : null;
};

export const parseReturnDocumentText = (text: string): ParsedCollectionData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const parsedData: Partial<ParsedCollectionData> = {
    unique_number: generateUniqueNumber('DOC'),
    status_coleta: 'pendente',
    type: 'coleta',
    items: [],
    modelo_aparelho: null,
    modelo_aparelho_description: null,
    client_control: null, // Inicializado como null para garantir que fique em branco se não for encontrado
    contrato: null, // Novo campo
    nf_glbl: null, // Novo campo
    partner_code: null, // Novo campo
    origin_address_number: null, // Novo campo
    destination_address_number: null, // Novo campo
  };

  let currentObservacao = [];
  let inItemsSection = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes('descrição') && lowerLine.includes('quant. inst.')) {
      inItemsSection = true;
      continue;
    }

    if (inItemsSection) {
      if (
        lowerLine.startsWith('recolhimento:') ||
        lowerLine.startsWith('obs.:') ||
        lowerLine.startsWith('data do recolhimento:') ||
        lowerLine.startsWith('tecnico responsável:') ||
        lowerLine.startsWith('nr. contrato:') ||
        lowerLine.startsWith('cliente:')
      ) {
        inItemsSection = false;
      } else {
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
          continue;
        }
      }
    }

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
      const partnerCodeMatch = line.match(/cód\. parc:\s*(\d+)/i); // Regex para extrair apenas números
      if (partnerCodeMatch && partnerCodeMatch[1]) {
        parsedData.partner_code = partnerCodeMatch[1].trim();
      }
    } else if (lowerLine.startsWith('contrato sankhya:')) {
      const nfGlblMatch = line.match(/contrato sankhya:\s*(\d+)/i); // Regex para extrair apenas números
      if (nfGlblMatch && nfGlblMatch[1]) {
        parsedData.nf_glbl = nfGlblMatch[1].trim();
      }
    } else if (lowerLine.startsWith('nr. contrato:')) {
      parsedData.contrato = line.replace(/nr\. contrato:/i, '').trim(); // Mapeado para contrato
    } else if (lowerLine.startsWith('endereço:')) {
      const addressText = line.replace(/endereço:/i, '').trim();
      parsedData.endereco_origem = addressText;
      const cepMatch = addressText.match(/(\d{5}-?\d{3})/);
      if (cepMatch) {
        parsedData.cep_origem = cepMatch[1].replace(/\D/g, '');
      }
      const numberMatch = addressText.match(/nº\s*(\d+)/i); // Tenta extrair "nº 123"
      if (numberMatch && numberMatch[1]) {
        parsedData.origin_address_number = numberMatch[1].trim();
      } else {
        const lastWord = addressText.split(' ').pop(); // Tenta a última palavra como número
        if (lastWord && !isNaN(Number(lastWord))) {
          parsedData.origin_address_number = lastWord;
        }
      }
    } else if (lowerLine.startsWith('número do endereço de origem:') || lowerLine.startsWith('número de origem:')) {
      parsedData.origin_address_number = line.split(':').slice(1).join(':').trim();
    } else if (lowerLine.startsWith('número do endereço de destino:') || lowerLine.startsWith('número de destino:')) {
      parsedData.destination_address_number = line.split(':').slice(1).join(':').trim();
    } else if (
      lowerLine.includes('telefone') || 
      lowerLine.includes('phone') || 
      lowerLine.includes('mobile')
    ) {
      const phoneValue = line.split(':').slice(1).join(':').trim() || line.trim();
      const extractedPhone = phoneValue.match(/(\+?\d[\d\s\-\(\)]+)/);
      if (extractedPhone && extractedPhone[1]) {
        parsedData.telefone = cleanPhoneNumber(extractedPhone[1].trim());
      } else {
        parsedData.telefone = cleanPhoneNumber(phoneValue); // Fallback to cleaning the whole value
      }
    } else if (lowerLine.startsWith('email:')) {
      parsedData.email = line.replace(/email:/i, '').trim();
    } else if (lowerLine.startsWith('data do recolhimento:')) {
      const dateString = line.replace(/data do recolhimento:/i, '').trim();
      parsedData.previsao_coleta = parseDateSafely(dateString);
    } else if (lowerLine.startsWith('data:')) {
      if (!parsedData.previsao_coleta) {
        const dateString = line.replace(/data:/i, '').trim();
        parsedData.previsao_coleta = parseDateSafely(dateString);
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
    // Lógica refinada para client_control: exige um prefixo claro seguido por ':'
    else if (
      lowerLine.startsWith('controle do cliente:') || 
      lowerLine.startsWith('client control:') ||
      lowerLine.startsWith('os:') || 
      lowerLine.startsWith('pedido:') || 
      lowerLine.startsWith('número da coleta:') || 
      lowerLine.startsWith('unique number:')
    ) {
      parsedData.client_control = line.split(':').slice(1).join(':').trim();
    }
  }

  if (currentObservacao.length > 0) {
    parsedData.observacao = (parsedData.observacao ? parsedData.observacao + '\n' : '') + currentObservacao.join('\n');
  }

  parsedData.parceiro = parsedData.parceiro || 'Cliente Desconhecido';
  parsedData.endereco_origem = parsedData.endereco_origem || 'Endereço Desconhecido';
  parsedData.previsao_coleta = parsedData.previsao_coleta || parseDateSafely(new Date());
  parsedData.items = parsedData.items || [];

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
  const selectedCellMap = new Map<number, Map<number, string | number | null>>();

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

  for (const rIndex of sortedRowIndices) {
    const row = selectedCellMap.get(rIndex);
    if (row) {
      for (const cIndex of Array.from(row.keys()).sort((a, b) => a - b)) {
        const cellValue = String(row.get(cIndex) || '').toLowerCase();
        if (cellValue.includes('descrição')) {
          descCol = cIndex;
        }
        if (cellValue.includes('quant.') && cellValue.includes('inst.')) {
          quantCol = cIndex;
        }
      }
      if (descCol !== null && quantCol !== null) {
        break; 
      }
    }
  }

  if (descCol !== null && quantCol !== null) {
    const headerRowIndex = sortedRowIndices.find(rIndex => {
      const row = selectedCellMap.get(rIndex);
      return row?.has(descCol) && String(row.get(descCol) || '').toLowerCase().includes('descrição');
    });

    const dataStartRowIndex = headerRowIndex !== undefined ? headerRowIndex + 1 : sortedRowIndices[0];

    for (const rIndex of sortedRowIndices) {
      if (rIndex < dataStartRowIndex) continue;

      const row = selectedCellMap.get(rIndex);
      if (row && row.has(descCol) && row.has(quantCol)) {
        const description = String(row.get(descCol) || '');
        const quantity = parseInt(String(row.get(quantCol)), 10);

        if (description.trim() !== '' && !isNaN(quantity) && quantity > 0) {
          itemRows.push({
            product_code: description.trim(),
            product_description: description.trim(),
            quantity: quantity,
          });
        }
      }
    }
  } else {
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

        if (textCount1 > maxTextCount && numCount2 > maxNumCount && textCount1 > numCount1 && numCount2 > textCount2) {
          maxTextCount = textCount1;
          maxNumCount = numCount2;
          bestDescCol = cIndex1;
          bestQuantCol = cIndex2;
        }
        if (textCount2 > maxTextCount && numCount1 > maxNumCount && textCount2 > numCount2 && numCount1 > textCount1) {
          maxTextCount = textText2;
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
    previsao_coleta: parseDateSafely(new Date()),
    client_control: null, // Inicializado como null para garantir que fique em branco se não for encontrado
    contrato: null, // Novo campo
    nf_glbl: null, // Novo campo
    partner_code: null, // Novo campo
    origin_address_number: null, // Novo campo
    destination_address_number: null, // Novo campo
  };

  const selectedCells: { rowIndex: number; colIndex: number; value: string | number | null }[] = [];
  selectedCellKeys.forEach(key => {
    const [rowIndexStr, colIndexStr] = key.split(':');
    const rowIndex = parseInt(rowIndexStr);
    const colIndex = parseInt(colIndexStr);
    selectedCells.push({ rowIndex, colIndex, value: spreadsheetData[rowIndex]?.[colIndex] });
  });

  selectedCells.sort((a, b) => {
    if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
    return a.colIndex - b.colIndex;
  });

  for (const cell of selectedCells) {
    const cellValue = String(cell.value || '').trim();
    const lowerCellValue = cellValue.toLowerCase();

    const getValue = (currentCell: typeof cell, checkAdjacent = true) => {
      const valueFromCurrent = currentCell.value ? String(currentCell.value).trim() : '';
      if (valueFromCurrent && !valueFromCurrent.includes(':')) return valueFromCurrent;

      const parts = valueFromCurrent.split(':');
      if (parts.length > 1 && parts[0].toLowerCase().includes(lowerCellValue.split(':')[0])) {
        return parts.slice(1).join(':').trim();
      }

      if (checkAdjacent && currentCell.colIndex + 1 < spreadsheetData[currentCell.rowIndex]?.length) {
        return String(spreadsheetData[currentCell.rowIndex][currentCell.colIndex + 1] || '').trim();
      }
      return '';
    };

    if (lowerCellValue.includes('cliente') || lowerCellValue.includes('nome do cliente') || lowerCellValue.includes('parceiro')) {
      const value = getValue(cell);
      if (value) parsedData.parceiro = value;
    }

    if (lowerCellValue.includes('endereço de origem') || lowerCellValue.includes('endereço') || lowerCellValue.includes('address')) {
      const value = getValue(cell);
      if (value) parsedData.endereco_origem = value;
      const cepMatch = (parsedData.endereco_origem || value).match(/(\d{5}-?\d{3})/);
      if (cepMatch) {
        parsedData.cep_origem = cepMatch[1].replace(/\D/g, '');
      }
    } else if (lowerCellValue.includes('cep de origem') || lowerCellValue.includes('cep')) {
      const value = getValue(cell);
      if (value) parsedData.cep_origem = value.replace(/\D/g, '');
    }
    if (lowerCellValue.includes('número do endereço de origem') || lowerCellValue.includes('número de origem')) {
      const value = getValue(cell);
      if (value) parsedData.origin_address_number = value;
    }
    if (lowerCellValue.includes('endereço de destino')) {
      const value = getValue(cell);
      if (value) parsedData.endereco_destino = value;
      const cepMatch = (parsedData.endereco_destino || value).match(/(\d{5}-?\d{3})/);
      if (cepMatch) {
        parsedData.cep_destino = cepMatch[1].replace(/\D/g, '');
      }
    } else if (lowerCellValue.includes('cep de destino')) {
      const value = getValue(cell);
      if (value) parsedData.cep_destino = value.replace(/\D/g, '');
    }
    if (lowerCellValue.includes('número do endereço de destino') || lowerCellValue.includes('número de destino')) {
      const value = getValue(cell);
      if (value) parsedData.destination_address_number = value;
    }

    if (lowerCellValue.includes('contato') || lowerCellValue.includes('pessoa de contato')) {
      const value = getValue(cell);
      if (value) parsedData.contato = value;
    }

    if (
      lowerCellValue.includes('telefone') || 
      lowerCellValue.includes('phone') || 
      lowerCellValue.includes('mobile')
    ) {
      const value = getValue(cell);
      if (value) parsedData.telefone = cleanPhoneNumber(value);
    }

    if (lowerCellValue.includes('email')) {
      const value = getValue(cell);
      if (value) parsedData.email = value;
    }

    if (lowerCellValue.includes('cnpj')) {
      const value = getValue(cell);
      if (value) parsedData.cnpj = value;
    }

    if (lowerCellValue.includes('data') || lowerCellValue.includes('previsão') || lowerCellValue.includes('data da coleta') || lowerCellValue.includes('data da entrega')) {
      let dateString = getValue(cell);
      if (dateString) {
        parsedData.previsao_coleta = parseDateSafely(dateString);
      }
    }

    // Lógica refinada para client_control: exige um prefixo claro seguido por ':' ou ser o próprio cabeçalho
    if (
      lowerCellValue.startsWith('controle do cliente') || 
      lowerCellValue.startsWith('client control') ||
      lowerCellValue.startsWith('os') || 
      lowerCellValue.startsWith('pedido') || 
      lowerCellValue.startsWith('número da coleta') || 
      lowerCellValue.startsWith('unique number')
    ) {
      const value = getValue(cell);
      if (value) parsedData.client_control = value;
    }
    
    if (lowerCellValue.includes('responsável') || lowerCellValue.includes('tecnico responsável')) {
      const value = getValue(cell);
      if (value) parsedData.responsavel = value;
    }

    if (lowerCellValue.includes('observação') || lowerCellValue.includes('obs')) {
      const value = getValue(cell);
      if (value) parsedData.observacao = value;
    }

    if (lowerCellValue.includes('contrato')) {
      const value = getValue(cell);
      if (value) parsedData.contrato = value;
    }
    if (lowerCellValue.includes('contrato sankhya')) {
      const nfGlblMatch = cellValue.match(/contrato sankhya:\s*(\d+)/i); // Regex para extrair apenas números
      if (nfGlblMatch && nfGlblMatch[1]) {
        parsedData.nf_glbl = nfGlblMatch[1].trim();
      } else {
        const value = getValue(cell);
        if (value) {
          const directNumberMatch = value.match(/(\d+)/);
          if (directNumberMatch && directNumberMatch[1]) {
            parsedData.nf_glbl = directNumberMatch[1].trim();
          } else {
            parsedData.nf_glbl = value; // Fallback to full value if no number found
          }
        }
      }
    }
    if (lowerCellValue.includes('cód. parc') || lowerCellValue.includes('cod parc')) {
      const value = getValue(cell);
      if (value) {
        const partnerCodeMatch = value.match(/(\d+)/); // Extrai apenas números
        if (partnerCodeMatch && partnerCodeMatch[1]) {
          parsedData.partner_code = partnerCodeMatch[1].trim();
        } else {
          parsedData.partner_code = value; // Fallback to full value if no number found
        }
      }
    }
  }

  parsedData.items = processSelectedSpreadsheetCellsForItems(spreadsheetData, selectedCellKeys);

  parsedData.parceiro = parsedData.parceiro || 'Cliente Desconhecido';
  parsedData.endereco_origem = parsedData.endereco_origem || 'Endereço Desconhecido';
  parsedData.previsao_coleta = parsedData.previsao_coleta || parseDateSafely(new Date());
  parsedData.items = parsedData.items || [];

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
  const selectedCellMap = new Map<number, Map<number, string | number | null>>();

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

  for (const rIndex of sortedRowIndices) {
    const row = selectedCellMap.get(rIndex);
    if (row) {
      for (const cIndex of Array.from(row.keys()).sort((a, b) => a - b)) {
        const cellValue = String(row.get(cIndex) || '').toLowerCase();
        if (cellValue.includes('descrição')) {
          descCol = cIndex;
        }
        if (cellValue.includes('quant.') && cellValue.includes('inst.')) {
          quantCol = cIndex;
        }
      }
      if (descCol !== null && quantCol !== null) {
        break; 
      }
    }
  }

  if (descCol !== null && quantCol !== null) {
    const headerRowIndex = sortedRowIndices.find(rIndex => {
      const row = selectedCellMap.get(rIndex);
      return row?.has(descCol) && String(row.get(descCol) || '').toLowerCase().includes('descrição');
    });

    const dataStartRowIndex = headerRowIndex !== undefined ? headerRowIndex + 1 : sortedRowIndices[0];

    for (const rIndex of sortedRowIndices) {
      if (rIndex < dataStartRowIndex) continue;

      const row = selectedCellMap.get(rIndex);
      if (row && row.has(descCol) && row.has(quantCol)) {
        const description = String(row.get(descCol) || '');
        const quantity = parseInt(String(row.get(quantCol)), 10);

        if (description.trim() !== '' && !isNaN(quantity) && quantity > 0) {
          itemRows.push({
            product_code: description.trim(),
            product_description: description.trim(),
            quantity: quantity,
          });
        }
      }
    }
  } else {
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

        if (textCount1 > maxTextCount && numCount2 > maxNumCount && textCount1 > numCount1 && numCount2 > textCount2) {
          maxTextCount = textCount1;
          maxNumCount = numCount2;
          bestDescCol = cIndex1;
          bestQuantCol = cIndex2;
        }
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

export const parseTechniciansXLSX = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readXLSX(file);
  return json.map(mapRowToTechnician).filter(t => t.first_name); // Apenas first_name é obrigatório
};

export const parseTechniciansCSV = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readCSV(file);
  return json.map(mapRowToTechnician).filter(t => t.first_name); // Apenas first_name é obrigatório
};

export const parseTechniciansJSON = async (file: File): Promise<TechnicianImportData[]> => {
  const json = await readJSON(file);
  return json.map(mapRowToTechnician).filter(t => t.first_name); // Apenas first_name é obrigatório
};