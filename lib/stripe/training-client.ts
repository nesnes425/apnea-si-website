import Stripe from "stripe";

let _trainingStripe: Stripe | null = null;

function getTrainingStripeInstance(): Stripe {
  if (_trainingStripe) return _trainingStripe;
  const secretKey = process.env.TRAINING_STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing TRAINING_STRIPE_SECRET_KEY environment variable");
  }
  _trainingStripe = new Stripe(secretKey, {
    appInfo: { name: "apnea.si trainings", url: "https://apnea.si" },
  });
  return _trainingStripe;
}

export const trainingStripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getTrainingStripeInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
