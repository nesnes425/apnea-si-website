const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function cleanParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );
}

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  if (GA_ID && window.gtag) {
    window.gtag("config", GA_ID, {
      page_path: path,
      anonymize_ip: true,
    });
  }

  if (window.fbq) {
    window.fbq("track", "PageView");
  }
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, cleanParams(params));
}

export function trackMetaEvent(name: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", name, cleanParams(params));
}

export function trackCourseBooking(params: AnalyticsParams = {}) {
  trackEvent("generate_lead", { lead_type: "course_application", ...params });
  trackMetaEvent("Lead", { content_name: "course_booking", ...params });
}

export function trackTrainingRegistration(params: AnalyticsParams = {}) {
  trackEvent("begin_checkout", { checkout_type: "training_membership", ...params });
  trackMetaEvent("Lead", { content_name: "training_registration", ...params });
}

export function trackPaymentComplete(params: AnalyticsParams = {}) {
  trackEvent("purchase", params);
  trackMetaEvent("Purchase", params);
}

export function trackGiftVoucherRequest(params: AnalyticsParams = {}) {
  trackEvent("generate_lead", { lead_type: "gift_voucher_request", ...params });
  trackMetaEvent("Lead", { content_name: "gift_voucher_request", ...params });
}

export function trackEmailSignup(params: AnalyticsParams = {}) {
  trackEvent("email_signup", params);
  trackMetaEvent("Lead", { content_name: "email_signup", ...params });
}
