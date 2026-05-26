import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class ExportService {

  // ── CSV ──────────────────────────────────────────────────────────
  exportCSV(project: any, budget: any, levels: any[], clientName: string) {
    const rows: string[] = [];
    const fmt = (n: number) => n?.toFixed(2) ?? '0.00';
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;

    rows.push(esc(`PRESUPUESTO: ${project?.name ?? ''}`));
    rows.push(esc(`Cliente: ${clientName}`));
    rows.push(esc(`Fecha: ${new Date().toLocaleDateString('es-DO')}`));
    rows.push('');
    rows.push(['No.', 'Descripción', 'Cantidad', 'Unidad', 'Precio Unit.', 'Total'].map(esc).join(','));

    for (const nivel of levels) {
      rows.push([esc(nivel.name), '', '', '', '', ''].join(','));
      for (const cap of nivel.chapters ?? []) {
        rows.push([esc(`  ${cap.chapter_number} — ${cap.name}`), '', '', '', '', ''].join(','));
        for (const item of cap.items ?? []) {
          rows.push([
            esc(item.item_number ?? ''),
            esc(item.description ?? ''),
            fmt(item.quantity),
            esc(item.unit ?? ''),
            fmt(item.unit_price),
            fmt(item.total),
          ].join(','));
        }
        rows.push([esc(`  Subtotal ${cap.name}`), '', '', '', '', fmt(cap.subtotal)].join(','));
      }
      rows.push([esc(`Subtotal ${nivel.name}`), '', '', '', '', fmt(nivel.subtotal)].join(','));
      rows.push('');
    }

    rows.push(['', '', '', '', esc('SUBTOTAL COSTOS DIRECTOS'), fmt(budget?.subtotal ?? 0)].join(','));
    if ((budget?.codia_total ?? 0) > 0)
      rows.push(['', '', '', '', esc(`CODIA (${budget.codia_rate}%)`), fmt(budget.codia_total)].join(','));
    if ((budget?.dir_tec_total ?? 0) > 0)
      rows.push(['', '', '', '', esc(`Dirección Técnica (${budget.dir_tec_rate}%)`), fmt(budget.dir_tec_total)].join(','));
    if ((budget?.ayudantes_total ?? 0) > 0)
      rows.push(['', '', '', '', esc(`Ayudantes (${budget.ayudantes_rate}%)`), fmt(budget.ayudantes_total)].join(','));
    if ((budget?.overhead_total ?? 0) > 0)
      rows.push(['', '', '', '', esc(`Gastos Generales (${budget.overhead_rate}%)`), fmt(budget.overhead_total)].join(','));
    if ((budget?.profit_total ?? 0) > 0)
      rows.push(['', '', '', '', esc(`Utilidad (${budget.profit_rate}%)`), fmt(budget.profit_total)].join(','));
    if ((budget?.contingency_total ?? 0) > 0)
      rows.push(['', '', '', '', esc(`Imprevistos (${budget.contingency_rate}%)`), fmt(budget.contingency_total)].join(','));
    if ((budget?.itbis_total ?? 0) > 0)
      rows.push(['', '', '', '', esc(`ITBIS (${budget.itbis_rate}%)`), fmt(budget.itbis_total)].join(','));
    rows.push(['', '', '', '', esc('GRAN TOTAL GENERAL'), fmt(budget?.grand_total ?? 0)].join(','));

    const bom = '﻿';
    const blob = new Blob([bom + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Presupuesto_${(project?.name ?? 'export').replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── PDF ──────────────────────────────────────────────────────────
  exportPDF(project: any, budget: any, levels: any[], clientName: string, logoBase64: string | null) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fmt = (n: number) => `$ ${(n ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const BRAND = [140, 79, 43] as [number, number, number];
    const DARK  = [0, 32, 96]   as [number, number, number];
    const WHITE = [255, 255, 255] as [number, number, number];
    const pageW = doc.internal.pageSize.getWidth();
    let y = 10;

    // ── Encabezado ──
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, pageW, 28, 'F');

    if (logoBase64 && logoBase64.startsWith('data:image')) {
      try { doc.addImage(logoBase64, 'PNG', 8, 3, 28, 20); } catch { /* skip bad image */ }
    }

    doc.setTextColor(...WHITE);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO DE OBRA', pageW / 2, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, pageW - 10, 12, { align: 'right' });

    y = 34;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PROYECTO:', 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.name ?? '', 35, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName, 35, y);
    y += 8;

    // ── Tabla de partidas ──
    for (const nivel of levels) {
      // Fila de nivel
      autoTable(doc, {
        startY: y,
        head: [[{ content: nivel.name.toUpperCase(), colSpan: 6 }]],
        body: [],
        styles: { fontSize: 8, fillColor: DARK, textColor: WHITE, fontStyle: 'bold', cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 70 }, 2: { cellWidth: 18 }, 3: { cellWidth: 12 }, 4: { cellWidth: 25 }, 5: { cellWidth: 28 } },
        margin: { left: 10, right: 10 },
        tableWidth: pageW - 20,
      });
      y = (doc as any).lastAutoTable.finalY;

      for (const cap of nivel.chapters ?? []) {
        const bodyRows: any[][] = [];

        // Fila capítulo
        bodyRows.push([{
          content: `${cap.chapter_number}  ${cap.name.toUpperCase()}`,
          colSpan: 6,
          styles: { fillColor: BRAND, textColor: WHITE, fontStyle: 'bold', fontSize: 8 }
        }]);

        // Partidas
        for (const item of cap.items ?? []) {
          bodyRows.push([
            item.item_number ?? '',
            item.description ?? '',
            { content: (item.quantity ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'center' } },
            { content: item.unit ?? '', styles: { halign: 'center' } },
            { content: fmt(item.unit_price), styles: { halign: 'right' } },
            { content: fmt(item.total), styles: { halign: 'right', fontStyle: 'bold' } },
          ]);
        }

        // Subtotal capítulo
        bodyRows.push([
          { content: `Subtotal ${cap.name}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: fmt(cap.subtotal), styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
        ]);

        autoTable(doc, {
          startY: y,
          head: [['No.', 'Descripción', 'Cantidad', 'Unidad', 'Precio Unit.', 'Total']],
          body: bodyRows,
          styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [40, 40, 40] },
          headStyles: { fillColor: [60, 60, 60], textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 70 },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 12, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 28, halign: 'right' },
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 10, right: 10 },
          tableWidth: pageW - 20,
        });
        y = (doc as any).lastAutoTable.finalY;
      }

      // Subtotal nivel
      autoTable(doc, {
        startY: y,
        body: [[{ content: `Subtotal ${nivel.name}`, styles: { halign: 'right', fontStyle: 'bold' } }, { content: fmt(nivel.subtotal), styles: { halign: 'right', fontStyle: 'bold' } }]],
        styles: { fontSize: 8, fillColor: DARK, textColor: WHITE, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: pageW - 48 }, 1: { cellWidth: 28 } },
        margin: { left: 10, right: 10 },
        tableWidth: pageW - 20,
      });
      y = (doc as any).lastAutoTable.finalY + 3;
    }

    // ── Totales finales ──
    const totalsBody: any[][] = [
      [{ content: 'SUBTOTAL COSTOS DIRECTOS', styles: { fontStyle: 'bold' } }, { content: fmt(budget?.subtotal ?? 0), styles: { fontStyle: 'bold', halign: 'right' } }],
    ];
    if ((budget?.codia_total ?? 0) > 0)
      totalsBody.push([`CODIA (${budget.codia_rate}%)`, { content: fmt(budget.codia_total), styles: { halign: 'right' } }]);
    if ((budget?.dir_tec_total ?? 0) > 0)
      totalsBody.push([`Dirección Técnica (${budget.dir_tec_rate}%)`, { content: fmt(budget.dir_tec_total), styles: { halign: 'right' } }]);
    if ((budget?.ayudantes_total ?? 0) > 0)
      totalsBody.push([`Ayudantes (${budget.ayudantes_rate}%)`, { content: fmt(budget.ayudantes_total), styles: { halign: 'right' } }]);
    if ((budget?.overhead_total ?? 0) > 0)
      totalsBody.push([`Gastos Generales (${budget.overhead_rate}%)`, { content: fmt(budget.overhead_total), styles: { halign: 'right' } }]);
    if ((budget?.profit_total ?? 0) > 0)
      totalsBody.push([`Utilidad (${budget.profit_rate}%)`, { content: fmt(budget.profit_total), styles: { halign: 'right' } }]);
    if ((budget?.contingency_total ?? 0) > 0)
      totalsBody.push([`Imprevistos (${budget.contingency_rate}%)`, { content: fmt(budget.contingency_total), styles: { halign: 'right' } }]);
    if ((budget?.itbis_total ?? 0) > 0)
      totalsBody.push([`ITBIS (${budget.itbis_rate}%)`, { content: fmt(budget.itbis_total), styles: { halign: 'right' } }]);
    totalsBody.push([
      { content: 'GRAN TOTAL GENERAL', styles: { fontStyle: 'bold', fillColor: BRAND, textColor: WHITE } },
      { content: fmt(budget?.grand_total ?? 0), styles: { fontStyle: 'bold', halign: 'right', fillColor: BRAND, textColor: [255, 220, 100] } },
    ]);

    autoTable(doc, {
      startY: y + 2,
      body: totalsBody,
      styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [40, 40, 40] },
      columnStyles: { 0: { cellWidth: pageW - 48 }, 1: { cellWidth: 28 } },
      margin: { left: 10, right: 10 },
      tableWidth: pageW - 20,
    });

    // ── Pie de página ──
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`PresuXcel — Página ${i} de ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
    }

    doc.save(`Presupuesto_${(project?.name ?? 'export').replace(/\s+/g, '_')}.pdf`);
  }
}
