import { PaymentGatewayFactory } from '@/services/payment';
import { ProviderFactory } from '@/services/provider';
import { env } from '@/config';

let paymentFactory: PaymentGatewayFactory | null = null;
let providerFactory: ProviderFactory | null = null;

/**
 * Get the singleton PaymentGatewayFactory instance.
 * Uses module-scoped singleton instead of global to avoid pollution.
 */
export function getPaymentFactory(): PaymentGatewayFactory {
  if (!paymentFactory) {
    paymentFactory = new PaymentGatewayFactory(env.PAYMENT_ENCRYPTION_KEY);
  }
  return paymentFactory;
}

/**
 * Get the singleton ProviderFactory instance.
 * Uses module-scoped singleton instead of global to avoid pollution.
 */
export function getProviderFactory(): ProviderFactory {
  if (!providerFactory) {
    providerFactory = new ProviderFactory();
  }
  return providerFactory;
}
