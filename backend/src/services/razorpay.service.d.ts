export declare const createRazorpayOrder: (amount: number, currency: string | undefined, receipt: string) => Promise<import("razorpay/dist/types/orders.js").Orders.RazorpayOrder>;
export declare const verifyRazorpaySignature: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) => boolean;
/**
 * Verify Razorpay Webhook Signature
 */
export declare const verifyRazorpayWebhook: (rawBody: string, signature: string) => boolean;
//# sourceMappingURL=razorpay.service.d.ts.map