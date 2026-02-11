// @ts-nocheck
import { jsPDF } from "jspdf";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables, Enums } from "@/integrations/supabase/types_generated";

type PestControlService = Tables<'pest_control_services'> & {
  client?: { name: string } | null;
  responsible_user?: { first_name: string; last_name: string } | null;
};

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

// RGB values for futuristic theme - ADJUSTED FOR A WHITE BACKGROUND
const COLOR_BACKGROUND_WHITE = [255, 255, 255]; // Fundo branco
const COLOR_BACKGROUND_ALT_ROW = [245, 245, 245]; // Um cinza muito claro para linhas alternadas
const COLOR_FOREGROUND_DARK = [30, 30, 30]; // Texto escuro para legibilidade no fundo branco
const COLOR_PRIMARY_NEON_CYAN = [0, 255, 255]; // hsl(180 100% 50%) - Azul neon
const COLOR_MUTED_FOREGROUND_DARK = [100, 100, 100]; // Cinza escuro para texto muted
const COLOR_BORDER_LIGHT = [200, 200, 200]; // Borda clara para elementos
const COLOR_BLACK = [0, 0, 0]; // Preto puro
const COLOR_GRAY_DARK = [50, 50, 50]; // Cinza escuro

export const generatePestControlServiceReport = async (
  services: PestControlService[],
  formatType: 'pdf' | 'csv',
  reportTitle: string
): Promise<void> => {
  const fileName = `${reportTitle.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}`;

  if (formatType === 'pdf') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let currentY = margin;

    // Helper para adicionar nova página e cabeçalho/rodapé
    const addPageWithHeaderAndFooter = () => {
      doc.addPage();
      doc.setFillColor(...COLOR_BACKGROUND_WHITE);
      doc.rect(0, 0, pageWidth, pageHeight, 'F'); // Redraw background for new page
      currentY = margin;
      
      // Header for new page
      doc.setFontSize(10);
      doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
      doc.setFont("helvetica", "normal");
      doc.text("Plataforma Logística 360", margin, currentY + 4);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}`, pageWidth - margin, currentY + 4, { align: "right" });
      currentY += 15;
      doc.setDrawColor(...COLOR_BORDER_LIGHT);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
    };

    // --- Report Title ---
    doc.setFontSize(18);
    doc.setTextColor(...COLOR_BLACK);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, pageWidth / 2, currentY + 5, { align: "center" });
    currentY += 15;
    doc.setDrawColor(...COLOR_BLACK);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // --- Services Table ---
    const tableHeaders = [
      "Cliente", "Endereço", "Data/Hora", "Técnico", "Pragas", "Ambiente",
      "Status", "Prioridade", "Duração (min)", "Observações"
    ];
    const tableUsableWidth = pageWidth - 2 * margin;
    const columnWidths = [
      tableUsableWidth * 0.15, // Cliente
      tableUsableWidth * 0.20, // Endereço
      tableUsableWidth * 0.12, // Data/Hora
      tableUsableWidth * 0.12, // Técnico
      tableUsableWidth * 0.10, // Pragas
      tableUsableWidth * 0.08, // Ambiente
      tableUsableWidth * 0.08, // Status
      tableUsableWidth * 0.08, // Prioridade
      tableUsableWidth * 0.07, // Duração (min)
      tableUsableWidth * 0.10, // Observações
    ];
    const tableRowHeight = 8;
    const tableHeaderHeight = 10;
    const tableCellPadding = 2;

    const drawTableHeader = () => {
      doc.setFillColor(...COLOR_GRAY_DARK);
      doc.rect(margin, currentY, tableUsableWidth, tableHeaderHeight, 'F');
      doc.setDrawColor(...COLOR_BLACK);
      doc.setLineWidth(0.2);
      doc.rect(margin, currentY, tableUsableWidth, tableHeaderHeight, 'S');

      let currentX = margin;
      doc.setFontSize(7); // Smaller font for headers
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      tableHeaders.forEach((header, i) => {
        doc.text(header, currentX + columnWidths[i] / 2, currentY + tableHeaderHeight / 2 + 1, { align: "center" });
        currentX += columnWidths[i];
        if (i < tableHeaders.length - 1) {
          doc.line(currentX, currentY, currentX, currentY + tableHeaderHeight);
        }
      });
      currentY += tableHeaderHeight;
    };

    drawTableHeader();

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_BLACK);

    for (const service of services) {
      const responsibleName = service.responsible_user ? 
        `${service.responsible_user.first_name || ''} ${service.responsible_user.last_name || ''}`.trim() : 
        'N/A';

      const rowData = [
        service.client?.name || 'N/A',
        service.address,
        `${format(new Date(service.service_date), 'dd/MM/yyyy', { locale: ptBR })} ${service.service_time || ''}`.trim(),
        responsibleName,
        (service.pests_detected as string[] || []).join(', ') || 'N/A',
        service.environment_type || 'N/A',
        service.status,
        service.priority,
        service.estimated_duration?.toString() || 'N/A',
        service.observations || 'N/A',
      ];

      let maxLineHeight = tableRowHeight;
      const wrappedLines: string[][] = [];
      rowData.forEach((cellText, i) => {
        const lines = doc.splitTextToSize(cellText, columnWidths[i] - 2 * tableCellPadding);
        wrappedLines.push(lines);
        if (lines.length * (doc.getFontSize() / doc.internal.scaleFactor + 1) > maxLineHeight) {
          maxLineHeight = lines.length * (doc.getFontSize() / doc.internal.scaleFactor + 1);
        }
      });

      if (currentY + maxLineHeight + 2 * tableCellPadding > pageHeight - margin) {
        addPageWithHeaderAndFooter();
        drawTableHeader();
      }

      let currentX = margin;
      doc.setDrawColor(...COLOR_BORDER_LIGHT);
      doc.setLineWidth(0.1);
      doc.setFontSize(7); // Smaller font for table content
      
      if (services.indexOf(service) % 2 === 0) {
        doc.setFillColor(...COLOR_BACKGROUND_ALT_ROW);
      } else {
        doc.setFillColor(...COLOR_BACKGROUND_WHITE);
      }
      doc.rect(margin, currentY, tableUsableWidth, maxLineHeight + 2 * tableCellPadding, 'F');

      rowData.forEach((cellText, i) => {
        doc.rect(currentX, currentY, columnWidths[i], maxLineHeight + 2 * tableCellPadding, 'S');
        
        let textX = currentX + tableCellPadding;
        let textY = currentY + tableCellPadding + doc.getFontSize() / doc.internal.scaleFactor;
        let align: 'left' | 'center' | 'right' = 'left';

        // Center align some columns
        if (i === 2 || i === 4 || i === 5 || i === 6 || i === 7 || i === 8) {
          textX = currentX + columnWidths[i] / 2;
          align = 'center';
        }

        doc.setTextColor(...COLOR_BLACK);
        doc.text(wrappedLines[i], textX, textY, { align: align });
        currentX += columnWidths[i];
      });
      currentY += maxLineHeight + 2 * tableCellPadding;
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_MUTED_FOREGROUND_DARK);
    doc.text("Plataforma Inteligente de Logística | Contato: rinaldo@solucoes.com", margin, pageHeight - margin);
    doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - margin, { align: "right" });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');

  } else if (formatType === 'csv') {
    const headers = [
      "ID", "Cliente", "ID Cliente", "Técnico Responsável", "ID Técnico Responsável", "Status",
      "Data do Serviço", "Hora do Serviço", "Pragas Detectadas", "Tipo de Ambiente", "Endereço",
      "Prioridade", "Duração Estimada (min)", "Observações", "Criado Em", "Atualizado Em"
    ];

    const rows = services.map(service => {
      const responsibleName = service.responsible_user ? 
        `${service.responsible_user.first_name || ''} ${service.responsible_user.last_name || ''}`.trim() : 
        '';
      return [
        `"${service.id}"`,
        `"${(service.client?.name || '').replace(/"/g, '""')}"`,
        `"${service.client_id || ''}"`,
        `"${responsibleName.replace(/"/g, '""')}"`,
        `"${service.responsible_user_id || ''}"`,
        `"${service.status}"`,
        `"${format(new Date(service.service_date), 'dd/MM/yyyy')}"`,
        `"${service.service_time || ''}"`,
        `"${(service.pests_detected as string[] || []).join(', ').replace(/"/g, '""')}"`,
        `"${(service.environment_type || '').replace(/"/g, '""')}"`,
        `"${service.address.replace(/"/g, '""')}"`,
        `"${service.priority}"`,
        `"${service.estimated_duration?.toString() || ''}"`,
        `"${(service.observations || '').replace(/"/g, '""')}"`,
        `"${format(new Date(service.created_at!), 'dd/MM/yyyy HH:mm:ss')}"`,
        `"${format(new Date(service.updated_at!), 'dd/MM/yyyy HH:mm:ss')}"`,
      ].join(',');
    });

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};