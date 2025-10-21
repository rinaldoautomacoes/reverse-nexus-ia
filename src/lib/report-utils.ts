import jsPDF from "jspdf"; // Revertido para importação padrão
import 'jspdf-autotable'; // Garante que o plugin seja carregado no contexto deste arquivo

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
      const pdfBlob = generatePdfReportContent(report, coletas);
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

const generatePdfReportContent = (report: Report, data: Coleta[]): Blob => {
  console.log("generatePdfReportContent: Iniciando geração de PDF.");
  console.log("jsPDF.prototype.autoTable antes da instância:", (jsPDF.prototype as any).autoTable);

  const doc = new jsPDF();
  console.log("generatePdfReportContent: Instância jsPDF criada.", doc);
  console.log("doc.autoTable após a instância:", (doc as any).autoTable);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("LogiReverseIA", margin, margin + 4);

  doc.setFontSize(22);
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Coleta", pageWidth / 2, margin + 10, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  doc.text(`Gerado em: ${format(now, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, margin + 4, { align: "right" });

  doc.setDrawColor(200);
  doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

  let currentY = margin + 25;
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

  const tableColumn = [
    "Nº Coleta", "Cliente", "Endereço de Coleta", "Responsável", "Material", "Qtd.", "Status", "Observações"
  ];
  const tableRows: any[] = [];

  data.forEach(item => {
    const rowData = [
      item.unique_number || item.id.substring(0, 8),
      item.parceiro || 'N/A',
      item.endereco_origem || 'N/A',
      item.responsavel || 'N/A',
      item.modelo_aparelho || 'N/A',
      (item.qtd_aparelhos_solicitado || 0).toString(),
      item.status_coleta === 'pendente' ? 'Pendente' : item.status_coleta === 'agendada' ? 'Em Trânsito' : 'Concluída',
      item.observacao || 'N/A',
    ];
    tableRows.push(rowData);
  });

  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [50, 50, 50],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: margin, right: margin },
    didDrawPage: function (data: any) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("LogiReverseIA | Contato: contato@logireverseia.com", margin, pageHeight - margin);
      doc.text(`Página ${data.pageNumber} de ${data.pageCount}`, pageWidth - margin, pageHeight - margin, { align: "right" });
    }
  });
  console.log("generatePdfReportContent: autoTable executado.");

  const finalY = (doc as any).autoTable.previous.finalY;
  if (finalY + 40 < pageHeight - margin) {
    doc.setDrawColor(150);
    doc.line(margin + 20, finalY + 30, margin + 80, finalY + 30);
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text("Assinatura do Responsável", margin + 20, finalY + 35);
  } else {
    doc.addPage();
    doc.setDrawColor(150);
    doc.line(margin + 20, margin + 30, margin + 80, margin + 30);
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text("Assinatura do Responsável", margin + 20, margin + 35);
  }

  console.log("generatePdfReportContent: Finalizando geração de PDF.");
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