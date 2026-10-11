/**
 * NagarSetu Export Service
 * Provides real client-side file generators for CSV, JSON Civic Ledgers, and formatted PDF documents.
 */

export const exportService = {
  /**
   * Generates and downloads a CSV file with BOM for Excel compatibility.
   */
  exportToCsv: (filename: string, headers: string[], rows: (string | number)[][]): void => {
    const csvContent =
      '\uFEFF' +
      [
        headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    exportService.triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
  },

  /**
   * Generates and downloads a formatted JSON file.
   */
  exportToJson: (filename: string, data: unknown): void => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    exportService.triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
  },

  /**
   * Generates a valid standard PDF-1.4 binary file with official municipal formatting.
   */
  exportToPdf: (filename: string, title: string, subtitle: string, lines: string[]): void => {
    // Generate valid raw PDF 1.4 stream
    const safeTitle = title.replace(/[()\\]/g, '');
    const safeSubtitle = subtitle.replace(/[()\\]/g, '');
    
    // Construct text stream
    let contentStream = `BT\n/F1 18 Tf\n50 780 Td\n(${safeTitle}) Tj\nET\n`;
    contentStream += `BT\n/F1 12 Tf\n50 755 Td\n(${safeSubtitle}) Tj\nET\n`;
    contentStream += `BT\n/F1 9 Tf\n50 735 Td\n(NagarSetu Municipal OS - ISO-37120 Certified Civic Audit Ledger) Tj\nET\n`;
    contentStream += `BT\n/F1 9 Tf\n50 720 Td\n(Generated: ${new Date().toLocaleString('en-IN')}) Tj\nET\n`;

    let y = 690;
    lines.forEach((line) => {
      if (y < 60) return; // Prevent overflow beyond page
      const safeLine = line.replace(/[()\\]/g, '');
      contentStream += `BT\n/F1 10 Tf\n50 ${y} Td\n(${safeLine}) Tj\nET\n`;
      y -= 16;
    });

    const streamLength = contentStream.length;

    const pdfParts: string[] = [];
    pdfParts.push('%PDF-1.4\n');
    pdfParts.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    pdfParts.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    pdfParts.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
    pdfParts.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
    pdfParts.push(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}endstream\nendobj\n`);

    // XRef table calculation
    const headerOffset = '%PDF-1.4\n'.length;
    const obj1Offset = headerOffset;
    const obj2Offset = obj1Offset + '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'.length;
    const obj3Offset = obj2Offset + '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'.length;
    const obj4Offset = obj3Offset + '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n'.length;
    const obj5Offset = obj4Offset + '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'.length;
    const xrefOffset = obj5Offset + `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}endstream\nendobj\n`.length;

    const pad = (num: number) => String(num).padStart(10, '0');

    const xref =
      `xref\n0 6\n` +
      `0000000000 65535 f \n` +
      `${pad(obj1Offset)} 00000 n \n` +
      `${pad(obj2Offset)} 00000 n \n` +
      `${pad(obj3Offset)} 00000 n \n` +
      `${pad(obj4Offset)} 00000 n \n` +
      `${pad(obj5Offset)} 00000 n \n` +
      `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    pdfParts.push(xref);

    const pdfBlob = new Blob([pdfParts.join('')], { type: 'application/pdf' });
    exportService.triggerDownload(pdfBlob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  },

  triggerDownload: (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }
};
