import prisma from "../../db.js";
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

export class MockPaymentProvider implements PaymentProvider {
  /**
   * Simulate creating a checkout session
   */
  async createCheckoutSession(options: CheckoutSessionOptions): Promise<string> {
    console.log(`[MOCK PAYMENT] Creating session for sub ${options.subscriptionId}, amount ${options.amount}`);
    
    // In mock, we return a local redirect URL or just a success token
    return `https://mock-gateway.com/pay?sub=${options.subscriptionId}&amount=${options.amount}&tenant=${options.tenantId}`;
  }

  /**
   * Simulate varying payment results
   */
  async verifyPayment(transactionId: string): Promise<boolean> {
    // In mock, treat any transaction starting with 'tx_fail' as failure, rest success
    return !transactionId.startsWith('tx_fail');
  }

  /**
   * Utility to manually record a payment in our DB (useful for mock flows)
   */
  static async recordPayment(data: {
    subscriptionId: string;
    tenantId: string;
    amount: number;
    transactionId: string;
    provider: SaaSPaymentProvider;
    status: SaaSPaymentStatus;
  }) {
    return await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: data.subscriptionId,
        tenantId: data.tenantId,
        amount: data.amount,
        transactionId: data.transactionId,
        provider: data.provider,
        status: data.status,
        paidAt: data.status === 'SUCCESS' ? new Date() : null
      }
    });
  }
}
