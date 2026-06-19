import Stripe from "stripe";
const getStripeInstance = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe secret key is not defined in environment variables.");
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-02-24.acacia", // Hardcode api version roughly matching current expectations
    });
};
export const createStripePaymentIntent = async (amount, currency = "USD", metadata = {}) => {
    try {
        const stripe = getStripeInstance();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe works with smallest currency unit
            currency,
            metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return paymentIntent;
    }
    catch (error) {
        console.error("[StripeService] Failed to create PaymentIntent:", error);
        throw error;
    }
};
/**
 * Handle Stripe webhook events securely
 */
export const verifyStripeWebhook = (rawBody, signature) => {
    try {
        const stripe = getStripeInstance();
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
        return event;
    }
    catch (error) {
        console.error("[StripeService] Webhook verification failed:", error);
        throw error;
    }
};
//# sourceMappingURL=stripe.service.js.map