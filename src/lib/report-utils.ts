import * as jsPDFModule from 'jspdf'; // Importado como namespace para garantir a aplicação do plugin
import 'jspdf-autotable'; // Este import estende o protótipo de jsPDFModule.default
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from 'xlsx';

type Coleta = Tables<'coletas'>;
type Item = Tables<'items'>;

interface ReportData {
  id?: string;
  title: string;
  period: string;
  type: string;
  format: string;
  status: string;
  description: string | null;
  collection_status_filter: string | null;
}

interface MonthlyPerformanceData {
  month: string;
  totalColetas: number;
  totalItems: number;
}

// Função auxiliar para buscar dados comuns a todos os formatos
const fetchReportData = async (reportData: ReportData, userId: string) => {
  let coletasQuery = supabase
    .from('coletas')
    .select('id, parceiro, endereco, previsao_coleta, status_coleta, qtd_aparelhos_solicitado, modelo_aparelho, observacao, created_at')
    .eq('user_id', userId);

  if (reportData.collection_status_filter && reportData.collection_status_filter !== 'todos') {
    coletasQuery = coletasQuery.eq('status_coleta', reportData.collection_status_filter);
  }
  const { data: coletas, error: coletasError } = await coletasQuery;
  if (coletasError) throw coletasError;

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('name, description, quantity, status, model, collection_id, created_at')
    .eq('user_id', userId);
  if (itemsError) throw itemsError;

  const itemsByCollection = new Map<string, Item[]>();
  items?.forEach(item => {
    if (item.collection_id) {
      if (!itemsByCollection.has(item.collection_id)) {
        itemsByCollection.set(item.collection_id, []);
      }
      itemsByCollection.get(item.collection_id)?.push(item);
    }
  });

  return { coletas, itemsByCollection, allItems: items };
};

// --- PDF Report Generation ---
const generatePdfReport = async (reportData: ReportData, userId: string, performanceChartData: MonthlyPerformanceData[]) => {
  const { coletas, itemsByCollection } = await fetchReportData(reportData, userId);

  const pdf = new jsPDFModule.default(); // Usando jsPDFModule.default para criar a instância
  let currentY = 30;

  pdf.setFontSize(20);
  pdf.setTextColor(0, 245, 255);
  pdf.text('LogiReverseIA - Relatório', 20, currentY);
  currentY += 20;
  
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(reportData.title, 20, currentY);
  currentY += 20;
  
  pdf.setFontSize(12);
  pdf.text(`Período: ${reportData.period}`, 20, currentY);
  currentY += 10;
  pdf.text(`Tipo: ${reportData.type}`, 20, currentY);
  currentY += 10;
  pdf.text(`Status do Relatório: ${reportData.status}`, 20, currentY);
  currentY += 10;
  pdf.text(`Filtro de Coletas: ${reportData.collection_status_filter === 'todos' ? 'Todas' : reportData.collection_status_filter}`, 20, currentY);
  currentY += 10;
  pdf.text(`Data de Geração: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, 20, currentY);
  currentY += 20;
  
  if (reportData.description) {
    pdf.text('Descrição:', 20, currentY);
    currentY += 10;
    const splitText = pdf.splitTextToSize(reportData.description, 170);
    pdf.text(splitText, 20, currentY);
    currentY += (splitText.length * 7) + 10;
  }
  
  if (currentY > 250) {
    pdf.addPage();
    currentY = 30;
  }

  // Adicionar dados do gráfico de performance
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Performance Mensal:', 20, currentY);
  currentY += 15;

  if (performanceChartData && performanceChartData.length > 0) {
    const headers = [['Mês', 'Total Coletas', 'Total Itens']];
    const tableData = performanceChartData.map(d => [d.month, d.totalColetas.toString(), d.totalItems.toString()]);
    
    (pdf as any).autoTable({ // Usar 'as any' para acessar autoTable
      startY: currentY,
      head: headers,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 245, 255], textColor: [0, 0, 0] },
      margin: { left: 20, right: 20 },
      didDrawPage: function (data: any) { // Adicionar tipo para 'data'
        currentY = data.cursor?.y || currentY;
      }
    });
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFontSize(12);
    pdf.text('Nenhum dado de performance mensal disponível.', 20, currentY);
    currentY += 10;
  }

  if (currentY > 250) {
    pdf.addPage();
    currentY = 30;
  }
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Detalhes das Coletas:', 20, currentY);
  currentY += 15;

  if (coletas && coletas.length > 0) {
    coletas.forEach((coleta, index) => {
      if (currentY > 250) {
        pdf.addPage();
        currentY = 30;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Coleta #${index + 1} - Cliente: ${coleta.parceiro || 'N/A'}`, 20, currentY);
      currentY += 8;
      pdf.setFontSize(10);
      pdf.text(`  Endereço: ${coleta.endereco || 'N/A'}`, 25, currentY);
      currentY += 6;
      pdf.text(`  Data Prevista: ${coleta.previsao_coleta ? format(new Date(coleta.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}`, 25, currentY);
      currentY += 6;
      pdf.text(`  Status: ${coleta.status_coleta || 'N/A'}`, 25, currentY);
      currentY += 6;
      pdf.text(`  Qtd. Aparelhos Solicitados: ${coleta.qtd_aparelhos_solicitado || 0}`, 25, currentY);
      currentY += 6;
      pdf.text(`  Tipo de Material: ${coleta.modelo_aparelho || 'N/A'}`, 25, currentY);
      currentY += 6;
      if (coleta.observacao) {
        const splitColetaObs = pdf.splitTextToSize(`  Observação: ${coleta.observacao}`, 160);
        pdf.text(splitColetaObs, 25, currentY);
        currentY += (splitColetaObs.length * 5);
      }

      const associatedItems = itemsByCollection.get(coleta.id);
      if (associatedItems && associatedItems.length > 0) {
        pdf.setFontSize(11);
        pdf.setTextColor(50, 50, 50);
        pdf.text('  Itens da Coleta:', 30, currentY + 4);
        currentY += 10;
        pdf.setFontSize(9);
        associatedItems.forEach((item) => {
          if (currentY > 260) {
            pdf.addPage();
            currentY = 30;
          }
          pdf.text(`  - Nome: ${item.name} (Qtd: ${item.quantity}, Status: ${item.status})`, 35, currentY);
          currentY += 5;
          if (item.description) {
            const splitItemDesc = pdf.splitTextToSize(`    Descrição: ${item.description}`, 150);
            pdf.text(splitItemDesc, 40, currentY);
            currentY += (splitItemDesc.length * 4);
          }
        });
      }
      currentY += 10;
    });
  } else {
    pdf.setFontSize(12);
    pdf.text('Nenhuma coleta encontrada para os filtros aplicados.', 20, currentY);
    currentY += 10;
  }
    
  if (currentY > 270) {
    pdf.addPage();
    currentY = 280;
  } else {
    currentY = 280;
  }
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Gerado automaticamente por LogiReverseIA', 20, currentY);
  pdf.text(`ID do Relatório: LR-${reportData.id || Date.now()}`, 20, currentY + 5);
  
  const fileName = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  pdf.save(fileName);
};

// --- Excel Report Generation ---
const generateExcelReport = async (reportData: ReportData, userId: string, performanceChartData: MonthlyPerformanceData[]) => {
  const { coletas, itemsByCollection } = await fetchReportData(reportData, userId);

  const data: any[][] = [];

  // Add report header
  data.push([reportData.title]);
  data.push([`Período: ${reportData.period}`]);
  data.push([`Tipo: ${reportData.type}`]);
  data.push([`Status do Relatório: ${reportData.status}`]);
  data.push([`Filtro de Coletas: ${reportData.collection_status_filter === 'todos' ? 'Todas' : reportData.collection_status_filter}`]);
  data.push([`Data de Geração: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`]);
  if (reportData.description) {
    data.push(['Descrição:', reportData.description]);
  }
  data.push([]); // Empty row for spacing

  // Adicionar dados do gráfico de performance
  data.push(['Performance Mensal:']);
  if (performanceChartData && performanceChartData.length > 0) {
    data.push(['Mês', 'Total Coletas', 'Total Itens']);
    performanceChartData.forEach(d => {
      data.push([d.month, d.totalColetas, d.totalItems]);
    });
  } else {
    data.push(['Nenhum dado de performance mensal disponível.']);
  }
  data.push([]); // Empty row for spacing

  data.push(['Detalhes das Coletas:']);
  data.push([]);

  if (coletas && coletas.length > 0) {
    coletas.forEach((coleta, index) => {
      data.push([`Coleta #${index + 1}`]);
      data.push(['Cliente:', coleta.parceiro || 'N/A']);
      data.push(['Endereço:', coleta.endereco || 'N/A']);
      data.push(['Data Prevista:', coleta.previsao_coleta ? format(new Date(coleta.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A']);
      data.push(['Status:', coleta.status_coleta || 'N/A']);
      data.push(['Qtd. Aparelhos Solicitados:', coleta.qtd_aparelhos_solicitado || 0]);
      data.push(['Tipo de Material:', coleta.modelo_aparelho || 'N/A']);
      if (coleta.observacao) {
        data.push(['Observação:', coleta.observacao]);
      }

      const associatedItems = itemsByCollection.get(coleta.id);
      if (associatedItems && associatedItems.length > 0) {
        data.push(['', 'Itens da Coleta:']);
        data.push(['', 'Nome do Item', 'Quantidade', 'Status do Item', 'Descrição do Item']);
        associatedItems.forEach((item) => {
          data.push([
            '',
            item.name,
            item.quantity,
            item.status,
            item.description || 'N/A'
          ]);
        });
      }
      data.push([]); // Space between collections
    });
  } else {
    data.push(['Nenhuma coleta encontrada para os filtros aplicados.']);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório de Coletas");

  const fileName = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// --- Word (HTML-based) Report Generation ---
const generateWordReport = async (reportData: ReportData, userId: string, performanceChartData: MonthlyPerformanceData[]) => {
  const { coletas, itemsByCollection } = await fetchReportData(reportData, userId);

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${reportData.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #00F5FF; font-size: 24px; }
            h2 { font-size: 18px; margin-top: 20px; }
            h3 { font-size: 16px; margin-top: 15px; }
            p { font-size: 12px; line-height: 1.5; }
            strong { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .section-title { margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        </style>
    </head>
    <body>
        <h1>LogiReverseIA - Relatório</h1>
        <h2>${reportData.title}</h2>
        <p><strong>Período:</strong> ${reportData.period}</p>
        <p><strong>Tipo:</strong> ${reportData.type}</p>
        <p><strong>Status do Relatório:</strong> ${reportData.status}</p>
        <p><strong>Filtro de Coletas:</strong> ${reportData.collection_status_filter === 'todos' ? 'Todas' : reportData.collection_status_filter}</p>
        <p><strong>Data de Geração:</strong> ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
  `;

  if (reportData.description) {
    htmlContent += `<p><strong>Descrição:</strong> ${reportData.description}</p>`;
  }

  // Adicionar dados do gráfico de performance
  htmlContent += `
        <h2 class="section-title">Performance Mensal:</h2>
  `;
  if (performanceChartData && performanceChartData.length > 0) {
    htmlContent += `
      <table>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Total Coletas</th>
            <th>Total Itens</th>
          </tr>
        </thead>
        <tbody>
    `;
    performanceChartData.forEach(d => {
      htmlContent += `
        <tr>
          <td>${d.month}</td>
          <td>${d.totalColetas}</td>
          <td>${d.totalItems}</td>
        </tr>
      `;
    });
    htmlContent += `
        </tbody>
      </table>
      <br>
    `;
  } else {
    htmlContent += `<p>Nenhum dado de performance mensal disponível.</p><br>`;
  }

  htmlContent += `
        <h2 class="section-title">Detalhes das Coletas:</h2>
  `;

  if (coletas && coletas.length > 0) {
    coletas.forEach((coleta, index) => {
      htmlContent += `
        <h3>Coleta #${index + 1} - Cliente: ${coleta.parceiro || 'N/A'}</h3>
        <p><strong>Endereço:</strong> ${coleta.endereco || 'N/A'}</p>
        <p><strong>Data Prevista:</strong> ${coleta.previsao_coleta ? format(new Date(coleta.previsao_coleta), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
        <p><strong>Status:</strong> ${coleta.status_coleta || 'N/A'}</p>
        <p><strong>Qtd. Aparelhos Solicitados:</strong> ${coleta.qtd_aparelhos_solicitado || 0}</p>
        <p><strong>Tipo de Material:</strong> ${coleta.modelo_aparelho || 'N/A'}</p>
      `;
      if (coleta.observacao) {
        htmlContent += `<p><strong>Observação:</strong> ${coleta.observacao}</p>`;
      }

      const associatedItems = itemsByCollection.get(coleta.id);
      if (associatedItems && associatedItems.length > 0) {
        htmlContent += `
          <h4>Itens da Coleta:</h4>
          <table>
            <thead>
              <tr>
                <th>Nome do Item</th>
                <th>Quantidade</th>
                <th>Status do Item</th>
                <th>Descrição do Item</th>
              </tr>
            </thead>
            <tbody>
        `;
        associatedItems.forEach((item) => {
          htmlContent += `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.status}</td>
              <td>${item.description || 'N/A'}</td>
            </tr>
          `;
        });
        htmlContent += `
            </tbody>
          </table>
        `;
      }
      htmlContent += `<br>`; // Space between collections
    });
  } else {
    htmlContent += `<p>Nenhuma coleta encontrada para os filtros aplicados.</p>`;
  }

  htmlContent += `
        <div style="margin-top: 50px; font-size: 10px; color: #808080;">
            <p>Gerado automaticamente por LogiReverseIA</p>
            <p>ID do Relatório: LR-${reportData.id || Date.now()}</p>
        </div>
    </body>
    </html>
  `;

  const fileName = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.doc`;
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Main function to generate report based on format
export const generateReport = async (reportData: ReportData, userId: string, performanceChartData: MonthlyPerformanceData[]) => {
  if (!reportData.format) {
    throw new Error("Formato do relatório não especificado.");
  }

  switch (reportData.format) {
    case 'PDF':
      await generatePdfReport(reportData, userId, performanceChartData);
      break;
    case 'Excel':
      await generateExcelReport(reportData, userId, performanceChartData);
      break;
    case 'Word':
      await generateWordReport(reportData, userId, performanceChartData);
      break;
    default:
      throw new Error(`Formato de relatório '${reportData.format}' não suportado.`);
  }
};