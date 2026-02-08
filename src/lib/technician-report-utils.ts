import { jsPDF } from "jspdf";
import * as XLSX from 'xlsx'; // Importar XLSX para CSV
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types_generated";

type Profile = Tables<'profiles'>;

// RGB values for futuristic theme - ADJUSTED FOR A WHITE BACKGROUND
const COLOR_BACKGROUND_WHITE = [255, 255, 255]; // Fundo branco
const COLOR_BACKGROUND_ALT_ROW = [245, 245, 245]; // Um cinza muito claro para linhas alternadas
const COLOR_FOREGROUND_DARK = [30, 30, 30]; // Texto escuro para legibilidade no fundo branco
const COLOR_PRIMARY_NEON_CYAN = [0, 255, 255]; // hsl(180 100% 50%) - Azul neon
const COLOR_MUTED_FOREGROUND_DARK = [100, 100, 100]; // Cinza escuro para texto muted
const COLOR_BORDER_LIGHT = [200, 200, 200]; // Borda clara para elementos
const COLOR_BLACK = [0, 0, 0]; // Preto puro
const COLOR_GRAY_DARK = [50, 50, 50]; // Cinza escuro

export const generateTechnicianReport = async (
  technicians: Profile[],
  allProfiles: Profile[], // Para resolver nomes de supervisores
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
    doc.setFontSize(18); // Increased font size for title
    doc.setTextColor(...COLOR_BLACK);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, pageWidth / 2, currentY + 5, { align: "center" }); // Centered title
    currentY += 15; // Adjust Y position after title
    doc.setDrawColor(...COLOR_BLACK);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY); // Separator line
    currentY += 10;

    // --- Technicians Table ---
    const tableHeaders = ["Nome Completo", "Função", "Equipe", "Nome da Equipe", "Modelo Moto", "Placa", "Telefone Empresa", "Telefone Pessoal", "Supervisor", "Endereço"];
    const tableUsableWidth = pageWidth - 2 * margin;
    const columnWidths = [
      tableUsableWidth * 0.14, // Nome Completo
      tableUsableWidth * 0.07, // Função
      tableUsableWidth * 0.07, // Equipe
      tableUsableWidth * 0.09, // Nome da Equipe
      tableUsableWidth * 0.09, // Modelo Moto
      tableUsableWidth * 0.07, // Placa
      tableUsableWidth * 0.10, // Telefone Empresa
      tableUsableWidth * 0.10, // Telefone Pessoal
      tableUsableWidth * 0.10, // Supervisor
      tableUsableWidth * 0.17, // Endereço
    ];
    const tableRowHeight = 8;
    const tableHeaderHeight = 10;
    const tableCellPadding = 2;

    const drawTableHeader = () => {
      doc.setFillColor(...COLOR_GRAY_DARK); // Dark gray background for item table header
      doc.rect(margin, currentY, tableUsableWidth, tableHeaderHeight, 'F');
      doc.setDrawColor(...COLOR_BLACK);
      doc.setLineWidth(0.2);
      doc.rect(margin, currentY, tableUsableWidth, tableHeaderHeight, 'S');

      let currentX = margin;
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255); // White text for item table header
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
    doc.setTextColor(...COLOR_BLACK); // Black text for item table content

    for (const tech of technicians) {
      const supervisorName = tech.supervisor_id ? 
        allProfiles.find(p => p.id === tech.supervisor_id)?.first_name || 'N/A' : 
        'N/A';

      const rowData = [
        `${tech.first_name || ''} ${tech.last_name || ''}`.trim(),
        tech.role === 'standard' ? 'Técnico' : tech.role,
        tech.team_shift === 'day' ? 'Dia' : 'Noite',
        tech.team_name || 'N/A', // Novo campo
        tech.phone_number || 'N/A',
        tech.personal_phone_number || 'N/A',
        supervisorName,
        tech.address || 'N/A',
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
      doc.setFontSize(8);
      
      if (technicians.indexOf(tech) % 2 === 0) {
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

        if (i === 1 || i === 2 || i === 3) { // Função, Equipe, Nome da Equipe
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
      "Nome Completo", "Primeiro Nome", "Sobrenome", "Função", "Equipe", "Nome da Equipe", // Novo campo
      "Telefone Empresa", "Telefone Pessoal", "Supervisor ID", "Nome Supervisor", "Endereço"
    ];

    const rows = technicians.map(tech => {
      const supervisorName = tech.supervisor_id ? 
        allProfiles.find(p => p.id === tech.supervisor_id)?.first_name || '' : 
        '';
      return [
        `"${`${tech.first_name || ''} ${tech.last_name || ''}`.trim().replace(/"/g, '""')}"`,
        `"${(tech.first_name || '').replace(/"/g, '""')}"`,
        `"${(tech.last_name || '').replace(/"/g, '""')}"`,
        `"${(tech.role === 'standard' ? 'Técnico' : tech.role).replace(/"/g, '""')}"`,
        `"${(tech.team_shift === 'day' ? 'Dia' : 'Noite').replace(/"/g, '""')}"`,
        `"${(tech.team_name || '').replace(/"/g, '""')}"`, // Novo campo
        `"${(tech.phone_number || '').replace(/"/g, '""')}"`,
        `"${(tech.personal_phone_number || '').replace(/"/g, '""')}"`,
        `"${(tech.supervisor_id || '').replace(/"/g, '""')}"`,
        `"${supervisorName.replace(/"/g, '""')}"`,
        `"${(tech.address || '').replace(/"/g, '""')}"`,
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