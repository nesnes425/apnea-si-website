// Voucher code = last 6 chars of the Stripe PaymentIntent ID, uppercased.
// Friendly to type and read; Samo finds the matching PI in Stripe Dashboard
// by searching for any PI ending in those 6 chars (Stripe Dashboard supports
// substring search on IDs).
export function voucherCodeFromPaymentIntentId(piId: string): string {
  return piId.slice(-6).toUpperCase();
}

// Human-friendly validity: 1 year from purchase date.
export function voucherValidUntil(purchaseDate: Date): Date {
  const d = new Date(purchaseDate);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}
