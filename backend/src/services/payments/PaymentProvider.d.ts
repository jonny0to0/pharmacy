import { SaaSPaymentStatus, SaaSPaymentProvider } from "@prisma/client";
export interface CheckoutSessionOptions {
    subscriptionId: string;
    tenantId: string;
    amount: number;
    currency?: string;
    planCode: string;
}
export interface PaymentProvider {
    createCheckoutSession(options: CheckoutSessionOptions): Promise<string>;
    verifyPayment(transactionId: string): Promise<boolean>;
}
export declare class MockPaymentProvider implements PaymentProvider {
    /**
     * Simulate creating a checkout session
     */
    createCheckoutSession(options: CheckoutSessionOptions): Promise<string>;
    /**
     * Simulate varying payment results
     */
    verifyPayment(transactionId: string): Promise<boolean>;
    /**
     * Utility to manually record a payment in our DB (useful for mock flows)
     */
    static recordPayment(data: {
        subscriptionId: string;
        tenantId: string;
        amount: number;
        transactionId: string;
        provider: SaaSPaymentProvider;
        status: SaaSPaymentStatus;
    }): Promise<any>;
}
//# sourceMappingURL=PaymentProvider.d.ts.map