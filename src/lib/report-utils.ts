import { jsPDF } from "jspdf";
import html2canvas from "html2canvas"; // Manter import para caso de uso futuro, mas não será usado para a tabela
// import "jspdf-autotable"; // REMOVIDO: Não usaremos mais o plugin jspdf-autotable

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Report = Tables<'reports'>;
type Coleta = Tables<'coletas'>;

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

  // Helper para adicionar nova página e cabeçalho/rodapé
  const addPageWithHeaderAndFooter = (pageNumber: number) => {
    doc.addPage();
    currentY = margin;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("LogiReverseIA", margin, currentY + 4);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, currentY + 4, { align: "right" });
    currentY += 15;
    doc.setDrawColor(200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    
    // Redesenhar cabeçalhos da tabela na nova página
    drawTableHeader();
  };

  // Cabeçalho do PDF
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("LogiReverseIA", margin, currentY + 4);

  doc.setFontSize(22);
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Coleta", pageWidth / 2, currentY + 10, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  doc.text(`Gerado em: ${format(now, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, currentY + 4, { align: "right" });

  currentY += 15;
  doc.setDrawColor(200);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Detalhes do Relatório
  doc.setFontSize(11);
  doc.setTextColor(50);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhes do Relatório:", margin, currentY);
  currentY += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(`Título: ${report.title}`, margin, currentY);
  currentY += 6;
  doc.text(`Descrição: ${report.description || 'N/A'}`, margin, currentY);
  currentY += 6;
  doc.text(`Período: ${report.start_date ? format(new Date(report.start_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'} - ${report.end_date ? format(new Date(report.end_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}`, margin, currentY);
  currentY += 6;
  doc.text(`Tipo de Coleta/Entrega: ${report.collection_type_filter === 'coleta' ? 'Coleta' : report.collection_type_filter === 'entrega' ? 'Entrega' : 'Todos'}`, margin, currentY);
  currentY += 6;
  doc.text(`Status Filtrado: ${report.collection_status_filter === 'pendente' ? 'Pendente' : report.collection_status_filter === 'agendada' ? 'Em Trânsito' : report.collection_status_filter === 'concluida' ? 'Concluída' : 'Todos'}`, margin, currentY);
  currentY += 10;

  // Tabela de Dados (implementação manual)
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.setFont("helvetica", "bold");
  doc.text("Dados das Coletas:", margin, currentY);
  currentY += 7;

  const tableHeaders = ["Nº Coleta", "Cliente", "Endereço de Origem", "Endereço de Destino", "Material", "Qtd", "Status", "Previsão"];
  const usableWidth = pageWidth - 2 * margin;
  const columnWidths = [
    usableWidth * 0.10, // Nº Coleta
    usableWidth * 0.15, // Cliente
    usableWidth * 0.25, // Endereço Origem
    usableWidth * 0.25, // Endereço Destino
    usableWidth * 0.10, // Material
    usableWidth * 0.05, // Qtd
    usableWidth * 0.05, // Status
    usableWidth * 0.05, // Previsão
  ];
  
  const rowHeight = 8;
  const headerHeight = 10;
  const cellPadding = 2;

  const drawTableHeader = () => {
    doc.setFillColor(240, 240, 240); // Cor de fundo para o cabeçalho
    doc.rect(margin, currentY, usableWidth, headerHeight, 'F'); // Desenha o fundo do cabeçalho
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.rect(margin, currentY, usableWidth, headerHeight, 'S'); // Desenha a borda do cabeçalho

    let currentX = margin;
    doc.setFontSize(8);
    doc.setTextColor(0);
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
  doc.setTextColor(50);

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

    if (currentY + maxLineHeight + cellPadding * 2 > pageHeight - margin) {
      addPageWithHeaderAndFooter(++pageNumber);
    }

    let currentX = margin;
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.setFontSize(8);
    
    // Desenha o fundo da linha (opcional, para linhas alternadas)
    // if (data.indexOf(item) % 2 === 0) {
    //   doc.setFillColor(248, 248, 248);
    //   doc.rect(margin, currentY, usableWidth, maxLineHeight + 2 * cellPadding, 'F');
    // }

    rowData.forEach((cellText, i) => {
      doc.rect(currentX, currentY, columnWidths[i], maxLineHeight + 2 * cellPadding, 'S'); // Desenha a borda da célula
      
      // Alinhamento de texto
      let textX = currentX + cellPadding;
      let textY = currentY + cellPadding + doc.getFontSize() / doc.internal.scaleFactor;
      let align: 'left' | 'center' | 'right' = 'left';

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
  doc.setTextColor(100);
  doc.text("LogiReverseIA | Contato: contato@logireverseia.com", margin, pageHeight - margin);
  doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - margin, { align: "right" });

  // Adicionar espaço para assinatura do responsável
  let signatureY = currentY + 20;
  if (signatureY + 30 > pageHeight - margin) { // Se não houver espaço, adiciona nova página
    doc.addPage();
    signatureY = margin + 20;
  }
  doc.setDrawColor(150);
  doc.line(margin + 20, signatureY, margin + 80, signatureY);
  doc.setFontSize(10);
  doc.setTextColor(50);
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