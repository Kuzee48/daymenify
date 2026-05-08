import { Router } from 'express';
import { handlePaymentWebhook } from './payment.webhook';
import { handleProviderWebhook } from './provider.webhook';

/**
 * Webhook Router
 *
 * Registers all incoming webhook endpoints for payment gateways and providers.
 * Each endpoint handles signature verification and async processing via queues.
 *
 * Important: These routes use raw body parsing for signature verification.
 */
export const webhookRouter = Router();

// ──────────────────────────────────────────────────────────
// Payment Gateway Webhooks
// ──────────────────────────────────────────────────────────

/** Tripay payment callback */
webhookRouter.post('/tripay', handlePaymentWebhook('tripay'));

/** Midtrans payment notification */
webhookRouter.post('/midtrans', handlePaymentWebhook('midtrans'));

/** Xendit payment callback */
webhookRouter.post('/xendit', handlePaymentWebhook('xendit'));

/** Duitku payment callback */
webhookRouter.post('/duitku', handlePaymentWebhook('duitku'));

/** BayarGG payment callback */
webhookRouter.post('/bayargg', handlePaymentWebhook('bayargg'));

/** Pakasir payment callback */
webhookRouter.post('/pakasir', handlePaymentWebhook('pakasir'));

// ──────────────────────────────────────────────────────────
// Provider Webhooks (Order Status Updates)
// ──────────────────────────────────────────────────────────

/** Digiflazz order status callback */
webhookRouter.post('/digiflazz', handleProviderWebhook('digiflazz'));

/** Tokovoucher order status callback */
webhookRouter.post('/tokovoucher', handleProviderWebhook('tokovoucher'));
