import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (_stripe) return _stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }
  _stripe = new Stripe(secretKey, {
    appInfo: { name: "apnea.si", url: "https://apnea.si" },
  });
  return _stripe;
}

// Lazy proxy: defers env check + SDK instantiation until first property access.
// Lets Next.js build succeed without STRIPE_SECRET_KEY set (route module evaluation
// during `next build` was throwing at top-level otherwise).
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripeInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
