import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  // Cabeçalho do PDF
  // Logotipo da empresa (placeholder, pois não temos um arquivo de logo)
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("LogiReverseIA", margin, currentY + 4); // Nome da empresa como placeholder para logo

  doc.setFontSize(22);
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Coleta", pageWidth / 2, currentY + 10, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  doc.text(`Gerado em: ${format(now, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, currentY + 4, { align: "right" });

  currentY += 15; // Espaço após o cabeçalho
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

  // Criar um div temporário para renderizar a tabela com html2canvas
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px'; // Esconder fora da tela
  tempDiv.style.width = `${pageWidth - 2 * margin}px`; // Corresponder à largura do PDF
  tempDiv.style.padding = '0';
  tempDiv.style.margin = '0';
  document.body.appendChild(tempDiv);

  // Construir o conteúdo da tabela HTML
  let tableHtml = `
    <style>
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-family: 'Inter', sans-serif; font-size: 9px; }
      th, td { border: 1px solid #e0e0e0; padding: 5px; text-align: left; vertical-align: top; }
      th { background-color: #f8f8f8; font-weight: bold; color: #333; }
      tr:nth-child(even) { background-color: #fdfdfd; }
      .status-pendente { color: #dc2626; font-weight: bold; } /* destructive */
      .status-agendada { color: #f59e0b; font-weight: bold; } /* warning-yellow */
      .status-concluida { color: #10b981; font-weight: bold; } /* success-green */
    </style>
    <table>
      <thead>
        <tr>
          <th>Nº Coleta</th>
          <th>Cliente</th>
          <th>Endereço de Coleta</th>
          <th>Responsável</th>
          <th>Tipo de Material</th>
          <th>Quantidade</th>
          <th>Status</th>
          <th>Observações</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(item => {
    const statusClass = item.status_coleta ? `status-${item.status_coleta}` : '';
    const statusText = item.status_coleta === 'pendente' ? 'Pendente' : item.status_coleta === 'agendada' ? 'Em Trânsito' : item.status_coleta === 'concluida' ? 'Concluída' : 'N/A';

    tableHtml += `
      <tr>
        <td>${item.unique_number || item.id.substring(0, 8)}</td>
        <td>${item.parceiro || 'N/A'}</td>
        <td>${item.endereco_origem || 'N/A'}</td>
        <td>${item.responsavel || 'N/A'}</td>
        <td>${item.modelo_aparelho || 'N/A'}</td>
        <td>${(item.qtd_aparelhos_solicitado || 0).toString()}</td>
        <td class="${statusClass}">${statusText}</td>
        <td>${item.observacao || 'N/A'}</td>
      </tr>
    `;
  });
  tableHtml += `</tbody></table>`;
  tempDiv.innerHTML = tableHtml;

  // Usar html2canvas para renderizar o div em um canvas
  const canvas = await html2canvas(tempDiv, {
    scale: 2, // Aumentar a escala para melhor resolução
    useCORS: true,
    windowWidth: document.documentElement.offsetWidth, // Captura a largura total da janela
    windowHeight: document.documentElement.offsetHeight, // Captura a altura total da janela
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth - 2 * margin;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;
  let pageHeightLeft = pageHeight - currentY - margin;

  let pageNum = 1;
  let position = currentY;

  // Adicionar a imagem ao PDF, dividindo em várias páginas se necessário
  if (imgHeight > pageHeightLeft) {
    const totalPages = Math.ceil(imgHeight / pageHeightLeft);
    for (let i = 0; i < totalPages; i++) {
      const sliceHeight = Math.min(imgHeight, pageHeightLeft);
      const imgSlice = document.createElement('canvas');
      imgSlice.width = canvas.width;
      imgSlice.height = (sliceHeight * canvas.width) / imgWidth;
      const sliceCtx = imgSlice.getContext('2d');
      if (sliceCtx) {
        sliceCtx.drawImage(canvas, 0, i * (pageHeightLeft * canvas.width / imgWidth), canvas.width, imgSlice.height, 0, 0, imgSlice.width, imgSlice.height);
      }
      const sliceDataUrl = imgSlice.toDataURL('image/png');
      
      if (i > 0) {
        doc.addPage();
        position = margin; // Reset position for new page
      }
      doc.addImage(sliceDataUrl, 'PNG', margin, position, imgWidth, sliceHeight);
      position += sliceHeight;
      imgHeight -= sliceHeight;

      // Rodapé para cada página
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("LogiReverseIA | Contato: contato@logireverseia.com", margin, pageHeight - margin);
      doc.text(`Página ${i + 1} de ${totalPages}`, pageWidth - margin, pageHeight - margin, { align: "right" });
    }
  } else {
    doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
    position = currentY + imgHeight;

    // Rodapé para a única página
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("LogiReverseIA | Contato: contato@logireverseia.com", margin, pageHeight - margin);
    doc.text(`Página 1 de 1`, pageWidth - margin, pageHeight - margin, { align: "right" });
  }

  // Remover o div temporário
  document.body.removeChild(tempDiv);

  // Adicionar espaço para assinatura do responsável
  let signatureY = position + 20;
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