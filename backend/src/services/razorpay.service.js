import Razorpay from "razorpay";
import crypto from "crypto";
const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay credentials are not defined in environment variables.");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};
export const createRazorpayOrder = async (amount, currency = "INR", receipt) => {
    try {
        const instance = getRazorpayInstance();
        const options = {
            amount: amount * 100, // Razorpay works with smallest currency unit (paise)
            currency,
            receipt,
            payment_capture: 1, // Auto capture
        };
        const order = await instance.orders.create(options);
        return order;
    }
    catch (error) {
        console.error("[RazorpayService] Failed to create order:", error);
        throw error;
    }
};
export const verifyRazorpaySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    try {
        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay secret not defined");
        }
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");
        return expectedSignature === razorpaySignature;
    }
    catch (error) {
        console.error("[RazorpayService] Signature verification failed:", error);
        return false;
    }
};
/**
 * Verify Razorpay Webhook Signature
 */
export const verifyRazorpayWebhook = (rawBody, signature) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret)
            throw new Error("Razorpay webhook secret not defined");
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");
        return expectedSignature === signature;
    }
    catch (error) {
        console.error("[RazorpayService] Webhook verification failed:", error);
        return false;
    }
};
//# sourceMappingURL=razorpay.service.js.map