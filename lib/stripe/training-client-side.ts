import { loadStripe, type Stripe } from "@stripe/stripe-js";

let trainingStripePromise: Promise<Stripe | null> | null = null;

export function getTrainingStripe() {
  if (!trainingStripePromise) {
    const key = process.env.NEXT_PUBLIC_TRAINING_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      return Promise.resolve(null);
    }
    trainingStripePromise = loadStripe(key);
  }
  return trainingStripePromise;
}
