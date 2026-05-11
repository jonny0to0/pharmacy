import express from "express";
import { WebhookService } from "../services/WebhookService.js";
import { BillingService } from "../services/BillingService.js";
import { verifyStripeWebhook } from "../services/stripe.service.js";
import { verifyRazorpayWebhook } from "../services/razorpay.service.js";
import { subscriptionpayment_provider } from "@prisma/client";

const router = express.Router();

/**
 * STRIPE WEBHOOK HANDLER
 */
router.post("/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = verifyStripeWebhook(req.body, sig);
  } catch (err) {
    console.error(`[Webhook] Stripe Signature Verification Failed:`, err);
    return res.status(400).send(`Webhook Error: Signature Verification Failed`);
  }

  // 1. Log Event & Check Idempotency
  const loggedEvent = await WebhookService.recordEvent(
    subscriptionpayment_provider.STRIPE,
    event.id,
    event.type,
    event
  );

  if (!loggedEvent) return res.send({ received: true }); // Already processed

  try {
    // 2. Process Logic (Simplified for this stage)
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful purchase
        console.log(`[Stripe] Checkout success: ${event.id}`);
        break;
      case 'invoice.payment_succeeded':
        // Handle renewal
        break;
      case 'customer.subscription.deleted':
        // Handle cancellation
        break;
    }

    // 3. Mark success
    await WebhookService.markProcessed(loggedEvent.id);
    res.send({ received: true });
  } catch (err) {
    await WebhookService.markFailed(loggedEvent.id, err as any);
    res.status(500).send("Internal processing error");
  }
});

/**
 * RAZORPAY WEBHOOK HANDLER
 */
router.post("/razorpay", express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = req.body.toString();
  
  if (!verifyRazorpayWebhook(rawBody, signature)) {
    console.error(`[Webhook] Razorpay Signature Verification Failed`);
    return res.status(400).send(`Webhook Error: Signature Verification Failed`);
  }

  const payload = JSON.parse(rawBody);
  const eventId = payload.id; // Razorpay event ID
  const eventType = payload.event;

  // 1. Log Event & Check Idempotency
  const loggedEvent = await WebhookService.recordEvent(
    subscriptionpayment_provider.RAZORPAY,
    eventId,
    eventType,
    payload
  );

  if (!loggedEvent) return res.send({ received: true });

  try {
    // 2. Process Logic
    console.log(`[Razorpay] Processing event: ${eventType}`);
    
    switch (eventType) {
      case 'subscription.charged':
        // Handle successful payment/renewal
        break;
      case 'subscription.pending':
        // Handle pending state
        break;
      case 'subscription.cancelled':
        // Handle cancellation
        break;
    }

    // 3. Mark success
    await WebhookService.markProcessed(loggedEvent.id);
    res.send({ status: 'ok' });
  } catch (err) {
    await WebhookService.markFailed(loggedEvent.id, err as any);
    res.status(500).send("Internal processing error");
  }
});

export default router;
