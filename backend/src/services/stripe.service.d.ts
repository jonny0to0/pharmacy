import Stripe from "stripe";
export declare const createStripePaymentIntent: (amount: number, currency?: string, metadata?: any) => Promise<Stripe.Response<Stripe.PaymentIntent>>;
/**
 * Handle Stripe webhook events securely
 */
export declare const verifyStripeWebhook: (rawBody: string | Buffer, signature: string) => Stripe.Event;
//# sourceMappingURL=stripe.service.d.ts.map