import jsPDF from "jspdf"; // Import jsPDF first
import 'jspdf-autotable'; // Then ensure the plugin is loaded

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // Importar locale para formatação de data

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
      query = query.lte('created_at', report.end_date + 'T23:59:59.999Z'); // Inclui o dia inteiro
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

    // Atualizar o status do relatório para 'concluido' e salvar a URL
    await supabase
      .from('reports')
      .update({ status: 'concluido', report_url: reportUrl })
      .eq('id', report.id);

  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error.message);
    // Atualizar o status do relatório para 'erro'
    await supabase
      .from('reports')
      .update({ status: 'erro', description: `Erro: ${error.message}` })
      .eq('id', report.id);
    throw error; // Re-throw para que o chamador possa lidar com o erro
  }
};

const uploadFileToStorage = async (userId: string, fileName: string, fileBlob: Blob, contentType: string) => {
  const filePath = `${userId}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('reports-files') // Nome do bucket
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
  const doc = new jsPDF();
  console.log("generatePdfReportContent: Instância jsPDF criada.", doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14; // Margem padrão

  // --- Cabeçalho ---
  // Placeholder para Logotipo da Empresa
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("LogiReverseIA", margin, margin + 4); // Nome da empresa como placeholder de logo

  doc.setFontSize(22);
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Coleta", pageWidth / 2, margin + 10, { align: "center" });

  // Data e Hora da Geração
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  doc.text(`Gerado em: ${format(now, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, margin + 4, { align: "right" });

  // Linha divisória
  doc.setDrawColor(200);
  doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

  // --- Informações do Relatório ---
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

  // --- Tabela de Dados ---
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
    theme: 'grid', // Estilo de grade para a tabela
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [230, 230, 230], // Cinza claro
      textColor: [50, 50, 50],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Cinza mais claro para linhas alternadas
    },
    margin: { left: margin, right: margin },
    didDrawPage: function (data: any) {
      // Rodapé em cada página
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("LogiReverseIA | Contato: contato@logireverseia.com", margin, pageHeight - margin);
      doc.text(`Página ${data.pageNumber} de ${data.pageCount}`, pageWidth - margin, pageHeight - margin, { align: "right" });
    }
  });
  console.log("generatePdfReportContent: autoTable executado.");

  // Espaço para assinatura
  const finalY = (doc as any).autoTable.previous.finalY;
  if (finalY + 40 < pageHeight - margin) { // Verifica se há espaço na página atual
    doc.setDrawColor(150);
    doc.line(margin + 20, finalY + 30, margin + 80, finalY + 30);
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text("Assinatura do Responsável", margin + 20, finalY + 35);
  } else { // Adiciona uma nova página se não houver espaço
    doc.addPage();
    doc.setDrawColor(150);
    doc.line(margin + 20, margin + 30, margin + 80, margin + 30);
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text("Assinatura do Responsável", margin + 20, margin + 35);
  }

  console.log("generatePdfReportContent: Finalizando geração de PDF.");
  return doc.output('blob'); // Retorna o PDF como Blob
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