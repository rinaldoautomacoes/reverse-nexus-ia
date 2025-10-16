import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types_generated";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

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

    if (report.format === 'pdf') {
      generatePdfReport(report, coletas);
    } else if (report.format === 'csv') {
      generateCsvReport(report, coletas);
    } else {
      throw new Error("Formato de relatório não suportado.");
    }

    // Atualizar o status do relatório para 'concluido'
    await supabase
      .from('reports')
      .update({ status: 'concluido' })
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

const generatePdfReport = (report: Report, data: Coleta[]) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(report.title, 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Descrição: ${report.description || 'N/A'}`, 14, 30);
  doc.text(`Período: ${format(new Date(report.start_date!), 'dd/MM/yyyy')} - ${format(new Date(report.end_date!), 'dd/MM/yyyy')}`, 14, 36);
  doc.text(`Tipo: ${report.collection_type_filter === 'coleta' ? 'Coletas' : report.collection_type_filter === 'entrega' ? 'Entregas' : 'Todos'}`, 14, 42);
  doc.text(`Status: ${report.collection_status_filter === 'pendente' ? 'Pendente' : report.collection_status_filter === 'agendada' ? 'Agendada/Em Trânsito' : report.collection_status_filter === 'concluida' ? 'Concluída' : 'Todos'}`, 14, 48);

  const tableColumn = [
    "ID", "Tipo", "Parceiro", "Endereço", "Previsão", "Qtd.", "Modelo", "Status", "Responsável"
  ];
  const tableRows: any[] = [];

  data.forEach(item => {
    const rowData = [
      item.id.substring(0, 8),
      item.type === 'coleta' ? 'Coleta' : 'Entrega',
      item.parceiro || 'N/A',
      item.endereco || 'N/A',
      item.previsao_coleta ? format(new Date(item.previsao_coleta), 'dd/MM/yyyy') : 'N/A',
      item.qtd_aparelhos_solicitado || 0,
      item.modelo_aparelho || 'N/A',
      item.status_coleta === 'pendente' ? 'Pendente' : item.status_coleta === 'agendada' ? 'Em Trânsito' : 'Concluída',
      item.responsavel || 'N/A',
    ];
    tableRows.push(rowData);
  });

  (doc as any).autoTable(tableColumn, tableRows, { startY: 60 });
  doc.save(`${report.title.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
};

const generateCsvReport = (report: Report, data: Coleta[]) => {
  const headers = [
    "ID", "Tipo", "Parceiro", "CNPJ", "Contato", "Telefone", "Email", "Endereço", "CEP", "Bairro", "Cidade", "UF", "Localidade",
    "Previsão Coleta/Entrega", "Qtd. Aparelhos Solicitado", "Modelo Aparelho", "Status Coleta", "Status Unidade",
    "NF GLBL", "NF Método", "Observação", "Responsável", "ID Responsável", "ID Cliente", "Contrato", "Criado Em"
  ];

  const rows = data.map(item => [
    `"${item.id}"`,
    `"${item.type === 'coleta' ? 'Coleta' : 'Entrega'}"`,
    `"${item.parceiro || ''}"`,
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

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.title.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};