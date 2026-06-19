/**
 * Mock GST Service for Medisynex
 * Until actual GST API credentials (e.g., ClearTax or GSTN) are available,
 * this service provides mock responses for E-Invoice and E-way bill generation.
 */
export interface GSTInvoicePayload {
    invoiceNumber: string;
    date: string;
    sellerGstin: string;
    buyerGstin?: string;
    totalAmount: number;
    igstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    items: Array<{
        hsnCode: string;
        quantity: number;
        taxableAmount: number;
    }>;
}
export declare const generateEInvoice: (payload: GSTInvoicePayload) => Promise<{
    status: string;
    irn: string;
    qrCode: string;
    ackNo: string;
    ackDate: string;
}>;
export declare const generateEWayBill: (payload: any) => Promise<{
    status: string;
    eway_bill: string;
    validUpto: string;
}>;
//# sourceMappingURL=gst.service.d.ts.map