import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Register fonts
(pdfMake as any).vfs = (pdfFonts as any).vfs;

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName?: string;
  customerGstin?: string;
  customerAddress?: string;
  businessName: string;
  businessAddress?: string;
  businessGstin?: string;
  businessPhone?: string;
  items: {
    name: string;
    hsnCode?: string;
    quantity: number;
    unit?: string;
    rate: number;
    discount?: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    total: number;
  }[];
  subTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  amountPaid: number;
  paymentMode?: string;
}

export function generateInvoicePDF(data: InvoiceData, download = true): void {
  const balance = data.grandTotal - data.amountPaid;
  const isPaid = balance <= 0;

  const tableBody: any[][] = [
    // Header row
    [
      { text: '#', style: 'tableHeader' },
      { text: 'Item Description', style: 'tableHeader' },
      { text: 'HSN', style: 'tableHeader', alignment: 'center' },
      { text: 'Qty', style: 'tableHeader', alignment: 'center' },
      { text: 'Rate (₹)', style: 'tableHeader', alignment: 'right' },
      { text: 'Disc (₹)', style: 'tableHeader', alignment: 'right' },
      { text: 'GST %', style: 'tableHeader', alignment: 'center' },
      { text: 'CGST (₹)', style: 'tableHeader', alignment: 'right' },
      { text: 'SGST (₹)', style: 'tableHeader', alignment: 'right' },
      { text: 'Total (₹)', style: 'tableHeader', alignment: 'right' },
    ],
    // Item rows
    ...data.items.map((item, idx) => [
      { text: String(idx + 1), style: 'tableCell', alignment: 'center' },
      { text: item.name, style: 'tableCell' },
      { text: item.hsnCode || '-', style: 'tableCell', alignment: 'center' },
      { text: `${item.quantity} ${item.unit || 'PC'}`, style: 'tableCell', alignment: 'center' },
      { text: item.rate.toFixed(2), style: 'tableCell', alignment: 'right' },
      { text: (item.discount || 0).toFixed(2), style: 'tableCell', alignment: 'right' },
      { text: `${item.gstRate}%`, style: 'tableCell', alignment: 'center' },
      { text: item.cgstAmount.toFixed(2), style: 'tableCell', alignment: 'right' },
      { text: item.sgstAmount.toFixed(2), style: 'tableCell', alignment: 'right' },
      { text: item.total.toFixed(2), style: 'tableCell', alignment: 'right', bold: true },
    ]),
  ];

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [30, 30, 30, 40],
    defaultStyle: { font: 'Roboto', fontSize: 9 },

    styles: {
      header: { fontSize: 20, bold: true, color: '#1e40af' },
      subHeader: { fontSize: 9, color: '#6b7280' },
      sectionLabel: { fontSize: 8, color: '#9ca3af', bold: true, margin: [0, 0, 0, 2] },
      sectionValue: { fontSize: 9, color: '#111827', bold: true },
      tableHeader: { fontSize: 8, bold: true, color: '#ffffff', fillColor: '#1e40af', margin: [4, 4, 4, 4] },
      tableCell: { fontSize: 8, color: '#374151', margin: [4, 3, 4, 3] },
      totalLabel: { fontSize: 9, color: '#6b7280' },
      totalValue: { fontSize: 9, color: '#111827', bold: true },
      grandTotalLabel: { fontSize: 11, bold: true, color: '#111827' },
      grandTotalValue: { fontSize: 14, bold: true, color: '#1e40af' },
      badge: { fontSize: 8, bold: true },
    },

    content: [
      // ─── Header Bar ───────────────────────────────────────────
      {
        columns: [
          {
            stack: [
              { text: data.businessName, style: 'header' },
              data.businessAddress ? { text: data.businessAddress, style: 'subHeader', margin: [0, 2, 0, 0] } : {},
              data.businessPhone ? { text: `Tel: ${data.businessPhone}`, style: 'subHeader' } : {},
              data.businessGstin ? { text: `GSTIN: ${data.businessGstin}`, style: 'subHeader' } : {},
            ],
          },
          {
            stack: [
              {
                text: 'TAX INVOICE',
                fontSize: 14, bold: true, color: '#1e40af',
                alignment: 'right',
              },
              {
                text: isPaid ? '✓ PAID' : `BALANCE DUE: ₹${balance.toFixed(2)}`,
                fontSize: isPaid ? 10 : 9,
                bold: true,
                color: isPaid ? '#16a34a' : '#dc2626',
                alignment: 'right',
                margin: [0, 4, 0, 0],
              },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 12],
      },

      // ─── Divider ──────────────────────────────────────────────
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 2, lineColor: '#1e40af' }], margin: [0, 0, 0, 12] },

      // ─── Invoice Meta + Bill To ────────────────────────────────
      {
        columns: [
          {
            width: '55%',
            stack: [
              { text: 'BILL TO', style: 'sectionLabel' },
              { text: data.customerName || 'Walk-in Customer', style: 'sectionValue', fontSize: 11 },
              data.customerGstin ? { text: `GSTIN: ${data.customerGstin}`, style: 'subHeader', margin: [0, 2, 0, 0] } : {},
              data.customerAddress ? { text: data.customerAddress, style: 'subHeader', margin: [0, 2, 0, 0] } : {},
            ],
          },
          {
            width: '45%',
            stack: [
              {
                columns: [
                  { text: 'Invoice No:', style: 'sectionLabel', width: 'auto' },
                  { text: data.invoiceNumber, style: 'sectionValue', alignment: 'right' },
                ],
                margin: [0, 0, 0, 4],
              },
              {
                columns: [
                  { text: 'Date:', style: 'sectionLabel', width: 'auto' },
                  { text: new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), style: 'sectionValue', alignment: 'right' },
                ],
                margin: [0, 0, 0, 4],
              },
              data.paymentMode ? {
                columns: [
                  { text: 'Payment:', style: 'sectionLabel', width: 'auto' },
                  { text: data.paymentMode, style: 'sectionValue', alignment: 'right' },
                ],
                margin: [0, 0, 0, 4],
              } : {},
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 16],
      },

      // ─── Items Table ───────────────────────────────────────────
      {
        table: {
          headerRows: 1,
          widths: [14, '*', 36, 36, 44, 36, 30, 40, 40, 44],
          body: tableBody,
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 1) ? 0 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#e5e7eb',
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#1e40af' : (rowIndex % 2 === 0 ? '#f9fafb' : null),
        },
        margin: [0, 0, 0, 12],
      },

      // ─── Totals Section ────────────────────────────────────────
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'PAYMENT INFORMATION', style: 'sectionLabel', margin: [0, 0, 0, 4] },
              {
                table: {
                  widths: ['*', '*'],
                  body: [
                    [{ text: 'Amount Paid:', style: 'tableCell' }, { text: `₹${data.amountPaid.toFixed(2)}`, style: 'tableCell', alignment: 'right', color: '#16a34a', bold: true }],
                    [{ text: 'Balance Due:', style: 'tableCell' }, { text: `₹${Math.max(0, balance).toFixed(2)}`, style: 'tableCell', alignment: 'right', color: balance > 0 ? '#dc2626' : '#16a34a', bold: true }],
                  ],
                },
                layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#e5e7eb' },
              },
            ],
          },
          { width: 20, text: '' },
          {
            width: 200,
            stack: [
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [{ text: 'Sub Total:', style: 'totalLabel' }, { text: `₹${data.subTotal.toFixed(2)}`, style: 'totalValue', alignment: 'right' }],
                    ...(data.cgst > 0 ? [[{ text: 'CGST:', style: 'totalLabel' }, { text: `₹${data.cgst.toFixed(2)}`, style: 'totalValue', alignment: 'right' }]] : []),
                    ...(data.sgst > 0 ? [[{ text: 'SGST:', style: 'totalLabel' }, { text: `₹${data.sgst.toFixed(2)}`, style: 'totalValue', alignment: 'right' }]] : []),
                    ...(data.igst > 0 ? [[{ text: 'IGST:', style: 'totalLabel' }, { text: `₹${data.igst.toFixed(2)}`, style: 'totalValue', alignment: 'right' }]] : []),
                    [
                      { text: 'GRAND TOTAL:', style: 'grandTotalLabel', margin: [0, 6, 0, 0] },
                      { text: `₹${data.grandTotal.toFixed(2)}`, style: 'grandTotalValue', alignment: 'right', margin: [0, 6, 0, 0] },
                    ],
                  ],
                },
                layout: { hLineWidth: (i: number, node: any) => i === node.table.body.length - 1 ? 0 : 0.5, vLineWidth: () => 0, hLineColor: () => '#e5e7eb' },
              },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // ─── Footer ────────────────────────────────────────────────
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }], margin: [0, 0, 0, 8] },
      {
        columns: [
          { text: 'Thank you for your business!\nGoods once sold will not be returned.', color: '#9ca3af', fontSize: 8 },
          { text: 'Authorised Signatory\n\n\n________________________', color: '#9ca3af', fontSize: 8, alignment: 'right' },
        ],
      },
    ],
  };

  const fileName = `${data.invoiceNumber}.pdf`;
  if (download) {
    pdfMake.createPdf(docDefinition).download(fileName);
  } else {
    pdfMake.createPdf(docDefinition).open();
  }
}
