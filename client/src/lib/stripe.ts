import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise && import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export const TOKEN_PACKAGES = {
  basic: {
    id: 'basic',
    name: 'Basic',
    tokens: 100,
    price: 4900, // in cents
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    tokens: 250,
    price: 9900,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tokens: 1000,
    price: 29900,
  },
} as const;

export type PackageId = keyof typeof TOKEN_PACKAGES;