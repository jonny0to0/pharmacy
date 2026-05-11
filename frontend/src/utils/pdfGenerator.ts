import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize fonts safely
const fonts: any = pdfFonts;
if (fonts && fonts.pdfMake && fonts.pdfMake.vfs) {
  (pdfMake as any).vfs = fonts.pdfMake.vfs;
} else if (fonts && fonts.vfs) {
  (pdfMake as any).vfs = fonts.vfs;
} else if (fonts && fonts.default && fonts.default.pdfMake) {
  (pdfMake as any).vfs = fonts.default.pdfMake.vfs;
}

export const generateInvoicePDF = (invoice: any, businessProfile: any) => {
  const documentDefinition: any = {
    content: [
      {
        text: businessProfile?.businessName || "MEDISYNEX PHARMACY",
        style: "header",
        alignment: "center"
      },
      {
        text: businessProfile?.address || "Address details",
        alignment: "center",
        margin: [0, 0, 0, 10]
      },
      {
        columns: [
          {
            text: `Invoice No: ${invoice.invoiceNumber}\nDate: ${new Date(invoice.date).toLocaleDateString()}\nStatus: ${invoice.status}`,
          },
          {
            text: `Customer: ${invoice.customer?.name || 'Walk-in'}\nMobile: ${invoice.customer?.mobile || 'N/A'}\nGSTIN: ${invoice.customer?.gstin || 'N/A'}`,
            alignment: "right"
          }
        ],
        margin: [0, 0, 0, 20]
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [{ text: 'Item', bold: true }, { text: 'Qty', bold: true }, { text: 'Rate', bold: true }, { text: 'Taxable', bold: true }, { text: 'GST', bold: true }, { text: 'Total', bold: true }],
            ...(invoice.items || []).map((item: any) => [
              item.product?.name || 'Unknown Item',
              item.quantity.toString(),
              `Rs ${item.rate.toFixed(2)}`,
              `Rs ${item.taxableAmount?.toFixed(2) || 0}`,
              `${item.gstRate}%`,
              `Rs ${item.total.toFixed(2)}`
            ]),
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              body: [
                ['Subtotal:', `Rs ${invoice.subTotal.toFixed(2)}`],
                ['Discount:', `Rs ${invoice.discount.toFixed(2)}`],
                ['Total Tax:', `Rs ${invoice.totalTax.toFixed(2)}`],
                [{ text: 'Grand Total:', bold: true }, { text: `Rs ${invoice.grandTotal.toFixed(2)}`, bold: true }]
              ]
            },
            layout: 'noBorders'
          }
        ]
      },
      {
        text: "\nThank you for your business!",
        alignment: "center",
        italics: true,
        margin: [0, 20, 0, 0]
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 5]
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  };

  pdfMake.createPdf(documentDefinition).download(`Invoice-${invoice.invoiceNumber}.pdf`);
  // If we wanted to just open or print: pdfMake.createPdf(documentDefinition).open();
};
