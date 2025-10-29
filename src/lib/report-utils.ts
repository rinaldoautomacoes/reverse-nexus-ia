import { jsPDF } from "jspdf";
import html2canvas from "html2canvas"; 

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Report = Tables<'reports'>;
type Coleta = Tables<'coletas'>;

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

export const generateReport = async (report: Report, userId: string) => {
  try {
    let query = supabase
      .from('coletas')
      .select('*')
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
      const pdfBlob = await generatePdfReportContent(report, coletas);
      const { publicUrl, uploadError } = await uploadFileToStorage(userId, fileName + '.pdf', pdfBlob, 'application/pdf');
      if (uploadError) throw uploadError;
      reportUrl = publicUrl;
    } else if (report.format === 'csv') {
      const csvBlob = generateCsvReportContent(report, coletas);
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
  const margin = 14;
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
    
    // Header
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
    doc.text("LogiReverseIA", margin, currentY + 4);
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, currentY + 4, { align: "right" });
    currentY += 15;
    doc.setDrawColor(...COLOR_BORDER_LIGHT);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    
    // Redesenhar cabeçalhos da tabela na nova página
    drawTableHeader();
  };

  // Cabeçalho do PDF
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
  doc.text("LogiReverseIA", margin, currentY + 4);

  doc.setFontSize(22);
  doc.setTextColor(...COLOR_PRIMARY_NEON_CYAN); // Main title color
  doc.setFont("helvetica", "bold");
  // Título dinâmico do relatório
  doc.text(`Relatório de ${report.type === 'coleta' ? 'Coleta' : report.type === 'entrega' ? 'Entrega' : 'Geral'}`, pageWidth / 2, currentY + 10, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  doc.text(`Gerado em: ${format(now, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, currentY + 4, { align: "right" });

  currentY += 15;
  doc.setDrawColor(...COLOR_BORDER_LIGHT);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Detalhes do Relatório (agora em cinza escuro)
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_FOREGROUND_DARK); // Alterado para cinza escuro
  doc.setFont("helvetica", "bold");
  doc.text("Detalhes do Relatório:", margin, currentY);
  currentY += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_FOREGROUND_DARK);
  doc.text(`Título: ${report.title}`, margin, currentY);
  currentY += 6;
  doc.text(`Descrição: ${report.description || 'N/A'}`, margin, currentY);
  currentY += 6;
  doc.text(`Período: ${report.start_date ? format(new Date(report.start_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'} - ${report.end_date ? format(new Date(report.end_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}`, margin, currentY);
  currentY += 6;

  // Lógica para exibir o tipo de operação de forma consistente
  let displayedCollectionType = '';
  if (report.type === 'coleta') {
    displayedCollectionType = `Tipo de Coleta: ${report.collection_type_filter === 'todos' ? 'Todos' : 'Coleta'}`;
  } else if (report.type === 'entrega') {
    displayedCollectionType = `Tipo de Entrega: ${report.collection_type_filter === 'todos' ? 'Todos' : 'Entrega'}`;
  } else { // Para relatórios do tipo 'geral' ou tipos inesperados
    displayedCollectionType = `Tipo de Operação: ${report.collection_type_filter === 'todos' ? 'Todos' : (report.collection_type_filter === 'coleta' ? 'Coleta' : 'Entrega')}`;
  }
  doc.text(displayedCollectionType, margin, currentY);
  currentY += 6;
  doc.text(`Status Filtrado: ${report.collection_status_filter === 'pendente' ? 'Pendente' : report.collection_status_filter === 'agendada' ? 'Em Trânsito' : report.collection_status_filter === 'concluida' ? 'Concluída' : 'Todos'}`, margin, currentY);
  currentY += 10;

  // Tabela de Dados (implementação manual)
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_FOREGROUND_DARK); // Alterado para cinza escuro
  doc.setFont("helvetica", "bold");
  doc.text("Dados das Coletas:", margin, currentY); // Mantido 'Coletas' aqui, pois o título principal já indica o tipo
  currentY += 7;

  // Cabeçalhos da tabela dinâmicos
  const tableHeaders = [
    report.type === 'coleta' ? "Nº Coleta" : "Nº Entrega",
    "Cliente",
    "Endereço de Origem",
    "Endereço de Destino",
    "Material",
    "Qtd",
    "Status",
    report.type === 'coleta' ? "Previsão Coleta" : "Previsão Entrega",
  ];
  const usableWidth = pageWidth - 2 * margin;
  // Ajuste das larguras das colunas para melhor visualização
  const columnWidths = [
    usableWidth * 0.12, // Nº Coleta/Entrega (mantido)
    usableWidth * 0.15, // Cliente (mantido)
    usableWidth * 0.20, // Endereço Origem (reduzido de 0.23)
    usableWidth * 0.19, // Endereço Destino (reduzido de 0.22)
    usableWidth * 0.08, // Material (mantido)
    usableWidth * 0.04, // Qtd (mantido)
    usableWidth * 0.10, // Status (aumentado de 0.08)
    usableWidth * 0.12, // Previsão Coleta/Entrega (aumentado de 0.08)
  ];
  
  const rowHeight = 8;
  const headerHeight = 10;
  const cellPadding = 2;

  const drawTableHeader = () => {
    // Simulate gradient fill for the header background (black to dark gray)
    const gradientStart = [0, 0, 0]; // Black
    const gradientEnd = [50, 50, 50]; // Dark Gray
    const numSteps = 10; // Number of steps for a smoother gradient simulation
    const stepWidth = usableWidth / numSteps;

    for (let i = 0; i < numSteps; i++) {
      const r = gradientStart[0] + (gradientEnd[0] - gradientStart[0]) * (i / (numSteps - 1));
      const g = gradientStart[1] + (gradientEnd[1] - gradientStart[1]) * (i / (numSteps - 1));
      const b = gradientStart[2] + (gradientEnd[2] - gradientStart[2]) * (i / (numSteps - 1));
      doc.setFillColor(r, g, b);
      doc.rect(margin + (i * stepWidth), currentY, stepWidth, headerHeight, 'F');
    }

    doc.setDrawColor(...COLOR_PRIMARY_NEON_CYAN); // Neon Cyan border
    doc.setLineWidth(0.2);
    doc.rect(margin, currentY, usableWidth, headerHeight, 'S'); // Desenha a borda do cabeçalho

    let currentX = margin;
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255); // White text for header
    doc.setFont("helvetica", "bold");
    tableHeaders.forEach((header, i) => {
      doc.text(header, currentX + columnWidths[i] / 2, currentY + headerHeight / 2 + 1, { align: "center" });
      currentX += columnWidths[i];
      if (i < tableHeaders.length - 1) {
        doc.line(currentX, currentY, currentX, currentY + headerHeight); // Linhas verticais do cabeçalho
      }
    });
    currentY += headerHeight;
  };

  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_FOREGROUND_DARK); // Dark text for table content

  let pageNumber = 1;

  for (const item of data) {
    const rowData = [
      item.unique_number || item.id.substring(0, 8),
      item.parceiro || 'N/A',
      item.endereco_origem || 'N/A',
      item.endereco_destino || 'N/A',
      item.modelo_aparelho || 'N/A',
      (item.qtd_aparelhos_solicitado || 0).toString(),
      item.status_coleta === 'pendente' ? 'Pendente' : item.status_coleta === 'agendada' ? 'Em Trânsito' : item.status_coleta === 'concluida' ? 'Concluída' : 'N/A',
      item.previsao_coleta ? format(new Date(item.previsao_coleta), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
    ];

    // Calcular altura da linha com base no conteúdo (especialmente endereços)
    let maxLineHeight = rowHeight;
    const wrappedLines: string[][] = [];
    rowData.forEach((cellText, i) => {
      const lines = doc.splitTextToSize(cellText, columnWidths[i] - 2 * cellPadding);
      wrappedLines.push(lines);
      if (lines.length * (doc.getFontSize() / doc.internal.scaleFactor + 1) > maxLineHeight) {
        maxLineHeight = lines.length * (doc.getFontSize() / doc.internal.scaleFactor + 1);
      }
    });

    if (currentY + maxLineHeight + 2 * cellPadding > pageHeight - margin) { // Ajustado para considerar o padding
      addPageWithHeaderAndFooter(++pageNumber);
    }

    let currentX = margin;
    doc.setDrawColor(...COLOR_BORDER_LIGHT); // Subtle border for rows
    doc.setLineWidth(0.1);
    doc.setFontSize(8);
    
    // Alternating row background
    if (data.indexOf(item) % 2 === 0) {
      doc.setFillColor(...COLOR_BACKGROUND_ALT_ROW); // Slightly lighter white for even rows
    } else {
      doc.setFillColor(...COLOR_BACKGROUND_WHITE); // Original white for odd rows
    }
    doc.rect(margin, currentY, usableWidth, maxLineHeight + 2 * cellPadding, 'F');

    rowData.forEach((cellText, i) => {
      doc.rect(currentX, currentY, columnWidths[i], maxLineHeight + 2 * cellPadding, 'S'); // Desenha a borda da célula
      
      // Alinhamento de texto
      let textX = currentX + cellPadding;
      let textY = currentY + cellPadding + doc.getFontSize() / doc.internal.scaleFactor;
      let align: 'left' | 'center' | 'right' = 'left';

      // Apply specific colors for status column
      if (i === 6) { // Status column
        if (cellText === 'Pendente') {
          doc.setTextColor(...COLOR_DESTRUCTIVE_RED);
        } else if (cellText === 'Em Trânsito') {
          doc.setTextColor(...COLOR_WARNING_ORANGE);
        } else if (cellText === 'Concluída') {
          doc.setTextColor(...COLOR_SUCCESS_GREEN);
        } else {
          doc.setTextColor(...COLOR_FOREGROUND_DARK);
        }
      } else {
        doc.setTextColor(...COLOR_FOREGROUND_DARK);
      }

      if (i === 5 || i === 6 || i === 7) { // Qtd, Status, Previsão (centralizado)
        textX = currentX + columnWidths[i] / 2;
        align = 'center';
      }

      doc.text(wrappedLines[i], textX, textY, { align: align });
      currentX += columnWidths[i];
    });
    currentY += maxLineHeight + 2 * cellPadding;
  }

  // Rodapé para a última página
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
  doc.text("LogiReverseIA | Contato: contato@logireverseia.com", margin, pageHeight - margin);
  doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - margin, { align: "right" });

  // Adicionar espaço para assinatura do responsável
  let signatureY = currentY + 20;
  if (signatureY + 30 > pageHeight - margin) { // Se não houver espaço, adiciona nova página
    addPageWithHeaderAndFooter(++pageNumber); // Use the helper to add a new page
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
    "ID", "Tipo", "Parceiro", "Controle Cliente", "CNPJ", "Contato", "Telefone", "Email", "Endereço", "CEP", "Bairro", "Cidade", "UF", "Localidade",
    "Previsão Coleta/Entrega", "Qtd. Aparelhos Solicitado", "Modelo Aparelho", "Status Coleta", "Status Unidade",
    "NF GLBL", "NF Método", "Observação", "Responsável", "ID Responsável", "ID Cliente", "Contrato", "Criado Em"
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
    `"${item.endereco || ''}"`,
    `"${item.cep || ''}"`,
    `"${item.bairro || ''}"`,
    `"${item.cidade || ''}"`,
    `"${item.uf || ''}"`,
    `"${item.localidade || ''}"`,
    `"${item.previsao_coleta ? format(new Date(item.previsao_coleta), 'dd/MM/yyyy') : ''}"`,
    `"${item.qtd_aparelhos_solicitado || 0}"`,
    `"${item.modelo_aparelho || ''}"`,
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
  ].join(','));

  const csvContent = [
    headers.join(','),
    ...rows
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};