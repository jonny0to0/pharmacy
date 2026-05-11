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

export const generateEInvoice = async (payload: GSTInvoicePayload) => {
  console.log("[GST Service] Mocking E-Invoice generation for:", payload.invoiceNumber);
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    status: "mocked",
    irn: `TEMP-IRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    qrCode: "MOCK_QR_CODE_DATA_STRING_FOR_PDF",
    ackNo: `ACK-${Date.now()}`,
    ackDate: new Date().toISOString(),
  };
};

export const generateEWayBill = async (payload: any) => {
  console.log("[GST Service] Mocking E-Way Bill generation...");
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    status: "mocked",
    eway_bill: `EWAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    validUpto: new Date(Date.now() + 86400000 * 2).toISOString(), // Valid for 2 days
  };
};
