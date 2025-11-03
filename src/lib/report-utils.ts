import { jsPDF } from "jspdf";
import html22canvas from "html2canvas"; // Renamed to avoid conflict with html2canvas import

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatItemDescriptionsForColeta, getTotalQuantityOfItems } from "./utils"; // Import new util
import { parseDateSafely } from './date-utils'; // Import from new date-utils

type Coleta = Tables<'coletas'> & {
  driver?: { name: string; license_plate?: string | null } | null; // Add license_plate
  transportadora?: { name: string } | null;
  items?: Array<Tables<'items'>> | null;
};
type Report = Tables<'reports'>;

// RGB values for futuristic theme - ADJUSTED FOR A WHITE BACKGROUND
const COLOR_BACKGROUND_WHITE = [255, 255, 255]; // Fundo branco
const COLOR_BACKGROUND_ALT_ROW = [245, 245, 245]; // Um cinza muito claro para linhas alternadas
const COLOR_FOREGROUND_DARK = [30, 30, 30]; // Texto escuro para legibilidade no fundo branco
const COLOR_PRIMARY_NEON_CYAN = [0, 255, 255]; // hsl(180 100% 50%) - Azul neon
const COLOR_NEON_BLUE_GRADIENT_END = [0, 150, 255]; // Um azul mais escuro para o fim do degradê (usado no degradê do cabeçalho)
const COLOR_DESTRUCTIVE_RED = [220, 38, 38]; // Vermelho para 'Pendente' (destructive)
const COLOR_WARNING_ORANGE = [251, 191, 36]; // Laranja para 'Em Trânsito' (warning-yellow)
const COLOR_SUCCESS_GREEN = [34, 197, 94]; // Verde para 'Concluída' (success-green)
const COLOR_MUTED_FOREGROUND_DARK = [100, 100, 100]; // Cinza escuro para texto muted
const COLOR_BORDER_LIGHT = [200, 200, 200]; // Borda clara para elementos
const COLOR_BLACK = [0, 0, 0]; // Preto puro
const COLOR_GRAY_DARK = [50, 50, 50]; // Cinza escuro

export const generateReport = async (report: Report, userId: string) => {
  try {
    let query = supabase
      .from('coletas')
      .select(`
        *,
        driver:drivers(name, license_plate),
        transportadora:transportadoras(name),
        items(*)
      `) // Fetch items, driver, and transportadora
      .eq('user_id', userId);

    if (report.collection_type_filter && report.collection_type_filter !== 'todos') {
      query = query.eq('type', report.collection_type_filter);
    }

    if (report.collection_status_filter && report.collection_status_filter !== 'todos') {
      query = query.eq('status_coleta', report.collection_status_filter);
    }

    if (report.start_date) {
      query = query.gte('created_at', report.start_date);
    }
    if (report.end_date) {
      query = query.lte('created_at', report.end_date + 'T23:59:59.999Z');
    }

    const { data: coletas, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar dados para o relatório: ${error.message}`);
    }

    if (!coletas || coletas.length === 0) {
      throw new Error("Nenhum dado encontrado para os critérios do relatório.");
    }

    let reportUrl: string | null = null;
    const fileName = `${report.title.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}`;

    if (report.format === 'pdf') {
      const pdfBlob = await generatePdfReportContent(report, coletas as Coleta[]); // Cast to Coleta[]
      const { publicUrl, uploadError } = await uploadFileToStorage(userId, fileName + '.pdf', pdfBlob, 'application/pdf');
      if (uploadError) throw uploadError;
      reportUrl = publicUrl;
    } else if (report.format === 'csv') {
      const csvBlob = generateCsvReportContent(report, coletas as Coleta[]); // Cast to Coleta[]
      const { publicUrl, uploadError } = await uploadFileToStorage(userId, fileName + '.csv', csvBlob, 'text/csv;charset=utf-8;');
      if (uploadError) throw uploadError;
      reportUrl = publicUrl;
    } else {
      throw new Error("Formato de relatório não suportado.");
    }

    await supabase
      .from('reports')
      .update({ status: 'concluido', report_url: reportUrl })
      .eq('id', report.id);

  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error.message);
    await supabase
      .from('reports')
      .update({ status: 'erro', description: `Erro: ${error.message}` })
      .eq('id', report.id);
    throw error;
  }
};

const uploadFileToStorage = async (userId: string, fileName: string, fileBlob: Blob, contentType: string) => {
  const filePath = `${userId}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('reports-files')
    .upload(filePath, fileBlob, {
      cacheControl: '3600',
      upsert: true,
      contentType: contentType,
    });

  if (uploadError) {
    return { publicUrl: null, uploadError: new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`) };
  }

  const { data: publicUrlData } = supabase.storage
    .from('reports-files')
    .getPublicUrl(filePath);
  
  return { publicUrl: publicUrlData.publicUrl, uploadError: null };
};

const generatePdfReportContent = async (report: Report, data: Coleta[]): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10; // Reduced margin for more content space
  let currentY = margin;

  // Set background for the entire page
  doc.setFillColor(...COLOR_BACKGROUND_WHITE);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Helper para adicionar nova página e cabeçalho/rodapé
  const addPageWithHeaderAndFooter = (pageNumber: number) => {
    doc.addPage();
    doc.setFillColor(...COLOR_BACKGROUND_WHITE);
    doc.rect(0, 0, pageWidth, pageHeight, 'F'); // Redraw background for new page
    currentY = margin;
    
    // Header for new page
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
    doc.setFont("helvetica", "normal");
    doc.text("LogiReverseIA", margin, currentY + 4);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, currentY + 4, { align: "right" });
    currentY += 15;
    doc.setDrawColor(...COLOR_BORDER_LIGHT);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
  };

  // --- Company Header (Placeholder for now) ---
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_BLACK);
  doc.setFont("helvetica", "bold");
  doc.text("CNPJ: 00.000.000/0000-00 Razão social: LogiReverseIA S.A.", margin, currentY);
  currentY += 5;
  doc.text("Endereço: Rua da Inovação, 1000, Centro, São Paulo - SP", margin, currentY);
  currentY += 8;
  doc.setDrawColor(...COLOR_BLACK);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY); // Separator line
  currentY += 5;

  // Iterate over each coleta/entrega to generate a separate report section
  for (const item of data) {
    if (currentY + 150 > pageHeight - margin) { // Estimate space needed for a new item section
      addPageWithHeaderAndFooter(doc.internal.getNumberOfPages() + 1);
    }

    // --- Section: Transporte ---
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_BLACK);
    doc.setFont("helvetica", "bold");
    doc.text("Transporte:", margin, currentY);
    currentY += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Empresa contratada: ${item.transportadora?.name || 'N/A'}`, margin, currentY);
    currentY += 5;
    doc.text(`Motorista: ${item.driver?.name || 'N/A'} // Ajudante: N/A // Responsável: ${item.responsavel || 'N/A'} // Placa: ${item.driver?.license_plate || 'N/A'}`, margin, currentY);
    currentY += 8;
    doc.setDrawColor(...COLOR_BLACK);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY); // Separator line
    currentY += 5;

    // --- Section: Dados da empresa (Cliente) ---
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_BLACK);
    doc.setFont("helvetica", "bold");
    doc.text("Dados da empresa:", margin, currentY);
    currentY += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Cliente: ${item.parceiro || 'N/A'}`, margin, currentY);
    currentY += 5;
    doc.text(`Endereço: ${item.endereco || 'N/A'}`, margin, currentY);
    currentY += 5;
    doc.text(`Contato da empresa: ${item.telefone || 'N/A'}`, margin, currentY);
    currentY += 5;
    doc.text(`Representante: ${item.contato || 'N/A'}`, margin, currentY);
    currentY += 5;
    doc.text(`Email: ${item.email || 'N/A'}`, margin, currentY);
    currentY += 8;
    doc.setDrawColor(...COLOR_BLACK);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY); // Separator line
    currentY += 5;

    // --- Section: Logística ---
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_BLACK);
    doc.setFont("helvetica", "bold");
    doc.text("Logística:", margin, currentY);
    currentY += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Tipo de operação logística: ${item.type === 'coleta' ? 'RETIRA' : 'ENTREGA'}`, margin, currentY);
    currentY += 5;
    doc.text(`Endereço da ${item.type === 'coleta' ? 'Retira' : 'Entrega'}: ${item.type === 'coleta' ? item.endereco_origem : item.endereco_destino || 'N/A'}`, margin, currentY);
    currentY += 5;
    doc.text(`${item.type === 'coleta' ? 'Retirado' : 'Entregue'} em: ${item.previsao_coleta ? format(new Date(item.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'} por: ${item.responsavel || 'N/A'}`, margin, currentY);
    currentY += 8;
    doc.setDrawColor(...COLOR_BLACK);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY); // Separator line
    currentY += 5;

    // --- Items Table ---
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_BLACK);
    doc.setFont("helvetica", "bold");
    doc.text("Itens:", margin, currentY);
    currentY += 7;

    const itemTableHeaders = ["DESCRIÇÃO", "NÚMERO DE SÉRIE", "QUANTIDADE", "ESPÉCIE", "OBS"];
    const itemTableUsableWidth = pageWidth - 2 * margin;
    const itemTableColumnWidths = [
      itemTableUsableWidth * 0.25, // DESCRIÇÃO
      itemTableUsableWidth * 0.30, // NÚMERO DE SÉRIE (using item.description as placeholder)
      itemTableUsableWidth * 0.15, // QUANTIDADE
      itemTableUsableWidth * 0.15, // ESPÉCIE
      itemTableUsableWidth * 0.15, // OBS
    ];
    const itemTableRowHeight = 8;
    const itemTableHeaderHeight = 10;
    const itemTableCellPadding = 2;

    const drawItemTableHeader = () => {
      doc.setFillColor(...COLOR_GRAY_DARK); // Dark gray background for item table header
      doc.rect(margin, currentY, itemTableUsableWidth, itemTableHeaderHeight, 'F');
      doc.setDrawColor(...COLOR_BLACK);
      doc.setLineWidth(0.2);
      doc.rect(margin, currentY, itemTableUsableWidth, itemTableHeaderHeight, 'S');

      let currentX = margin;
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255); // White text for item table header
      doc.setFont("helvetica", "bold");
      itemTableHeaders.forEach((header, i) => {
        doc.text(header, currentX + itemTableColumnWidths[i] / 2, currentY + itemTableHeaderHeight / 2 + 1, { align: "center" });
        currentX += itemTableColumnWidths[i];
        if (i < itemTableHeaders.length - 1) {
          doc.line(currentX, currentY, currentX, currentY + itemTableHeaderHeight);
        }
      });
      currentY += itemTableHeaderHeight;
    };

    drawItemTableHeader();

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_BLACK); // Black text for item table content

    if (item.items && item.items.length > 0) {
      for (const subItem of item.items) {
        const itemRowData = [
          subItem.name || 'N/A', // Product Code for DESCRIÇÃO
          subItem.description || 'N/A', // Product Description for NÚMERO DE SÉRIE (placeholder)
          (subItem.quantity || 0).toString(),
          "UNIDADE", // ESPÉCIE
          "", // OBS
        ];

        let maxItemLineHeight = itemTableRowHeight;
        const wrappedItemLines: string[][] = [];
        itemRowData.forEach((cellText, i) => {
          const lines = doc.splitTextToSize(cellText, itemTableColumnWidths[i] - 2 * itemTableCellPadding);
          wrappedItemLines.push(lines);
          if (lines.length * (doc.getFontSize() / doc.internal.scaleFactor + 1) > maxItemLineHeight) {
            maxItemLineHeight = lines.length * (doc.getFontSize() / doc.internal.scaleFactor + 1);
          }
        });

        if (currentY + maxItemLineHeight + 2 * itemTableCellPadding > pageHeight - margin) {
          addPageWithHeaderAndFooter(doc.internal.getNumberOfPages() + 1);
          drawItemTableHeader(); // Redraw header on new page
        }

        let currentX = margin;
        doc.setDrawColor(...COLOR_BORDER_LIGHT);
        doc.setLineWidth(0.1);
        doc.setFontSize(8);
        
        if (item.items.indexOf(subItem) % 2 === 0) {
          doc.setFillColor(...COLOR_BACKGROUND_ALT_ROW);
        } else {
          doc.setFillColor(...COLOR_BACKGROUND_WHITE);
        }
        doc.rect(margin, currentY, itemTableUsableWidth, maxItemLineHeight + 2 * itemTableCellPadding, 'F');

        itemRowData.forEach((cellText, i) => {
          doc.rect(currentX, currentY, itemTableColumnWidths[i], maxItemLineHeight + 2 * itemTableCellPadding, 'S');
          
          let textX = currentX + itemTableCellPadding;
          let textY = currentY + itemTableCellPadding + doc.getFontSize() / doc.internal.scaleFactor;
          let align: 'left' | 'center' | 'right' = 'left';

          if (i === 2) { // QUANTIDADE column
            textX = currentX + itemTableColumnWidths[i] / 2;
            align = 'center';
          } else if (i === 3 || i === 4) { // ESPÉCIE, OBS columns
            textX = currentX + itemTableColumnWidths[i] / 2;
            align = 'center';
          }

          doc.setTextColor(...COLOR_BLACK);
          doc.text(wrappedItemLines[i], textX, textY, { align: align });
          currentX += itemTableColumnWidths[i];
        });
        currentY += maxItemLineHeight + 2 * itemTableCellPadding;
      }
    } else {
      // No items found for this collection/delivery
      if (currentY + itemTableRowHeight + 2 * itemTableCellPadding > pageHeight - margin) {
        addPageWithHeaderAndFooter(doc.internal.getNumberOfPages() + 1);
        drawItemTableHeader();
      }
      doc.setFillColor(...COLOR_BACKGROUND_ALT_ROW);
      doc.rect(margin, currentY, itemTableUsableWidth, itemTableRowHeight + 2 * itemTableCellPadding, 'F');
      doc.setDrawColor(...COLOR_BORDER_LIGHT);
      doc.setLineWidth(0.1);
      doc.rect(margin, currentY, itemTableUsableWidth, itemTableRowHeight + 2 * itemTableCellPadding, 'S');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
      doc.text("Nenhum item registrado para esta operação.", pageWidth / 2, currentY + itemTableRowHeight / 2 + itemTableCellPadding + 1, { align: "center" });
      currentY += itemTableRowHeight + 2 * itemTableCellPadding;
    }

    currentY += 10; // Space after items table

    // Add a page break if there's another item to process and not enough space
    if (data.indexOf(item) < data.length - 1) {
      addPageWithHeaderAndFooter(doc.internal.getNumberOfPages() + 1);
    }
  }

  // Rodapé para a última página
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
  doc.text("LogiReverseIA | Contato: contato@logireverseia.com", margin, pageHeight - margin);
  doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - margin, { align: "right" });

  // Adicionar espaço para assinatura do responsável
  let signatureY = currentY + 20;
  if (signatureY + 30 > pageHeight - margin) { // Se não houver espaço, adiciona nova página
    addPageWithHeaderAndFooter(doc.internal.getNumberOfPages() + 1); // Use the helper to add a new page
    signatureY = currentY; // Reset signatureY to the new currentY after header
  }
  doc.setDrawColor(...COLOR_PRIMARY_NEON_CYAN); // Neon line for signature
  doc.setLineWidth(0.5);
  doc.line(margin + 20, signatureY, margin + 80, signatureY);
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_FOREGROUND_DARK);
  doc.text("Assinatura do Responsável", margin + 20, signatureY + 5);

  return doc.output('blob');
};

const generateCsvReportContent = (report: Report, data: Coleta[]): Blob => {
  const headers = [
    "ID", "Tipo", "Parceiro", "Controle Cliente", "CNPJ", "Contato", "Telefone", "Email", 
    "Endereço Origem", "CEP Origem", "Lat Origem", "Lng Origem",
    "Endereço Destino", "CEP Destino", "Lat Destino", "Lng Destino",
    "Previsão Coleta/Entrega", "Qtd. Aparelhos Solicitado", "Modelo Aparelho", "Descrição Materiais", "Status Coleta", "Status Unidade", 
    "NF GLBL", "NF Método", "Observação", "Responsável", "ID Responsável", "ID Cliente", "Contrato", "Criado Em",
    "Motorista", "Placa Motorista", "Transportadora", // Added driver and transportadora details
  ];

  const rows = data.map(item => [
    `"${item.id}"`,
    `"${item.type === 'coleta' ? 'Coleta' : 'Entrega'}"`,
    `"${item.parceiro || ''}"`,
    `"${item.client_control || ''}"`,
    `"${item.cnpj || ''}"`,
    `"${item.contato || ''}"`,
    `"${item.telefone || ''}"`,
    `"${item.email || ''}"`,
    `"${item.endereco_origem || ''}"`,
    `"${item.cep_origem || ''}"`,
    `"${item.origin_lat || ''}"`,
    `"${item.origin_lng || ''}"`,
    `"${item.endereco_destino || ''}"`,
    `"${item.cep_destino || ''}"`,
    `"${item.destination_lat || ''}"`,
    `"${item.destination_lng || ''}"`,
    `"${item.previsao_coleta ? format(new Date(item.previsao_coleta), 'dd/MM/yyyy') : ''}"`,
    `"${item.qtd_aparelhos_solicitado || 0}"`,
    `"${item.modelo_aparelho || ''}"`,
    `"${formatItemDescriptionsForColeta(item.items) || ''}"`,
    `"${item.status_coleta || ''}"`,
    `"${item.status_unidade || ''}"`,
    `"${item.nf_glbl || ''}"`,
    `"${item.nf_metodo || ''}"`,
    `"${item.observacao || ''}"`,
    `"${item.responsavel || ''}"`,
    `"${item.responsible_user_id || ''}"`,
    `"${item.client_id || ''}"`,
    `"${item.contrato || ''}"`,
    `"${item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm:ss') : ''}"`,
    `"${item.driver?.name || ''}"`,
    `"${item.driver?.license_plate || ''}"`,
    `"${item.transportadora?.name || ''}"`,
  ].join(','));

  const csvContent = [
    headers.join(','),
    ...rows
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};