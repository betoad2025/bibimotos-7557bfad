import { useCallback } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    ttq?: { track: (...args: any[]) => void };
    _tfa?: any[];
  }
}

type ConversionEvent =
  | "complete_registration"
  | "first_recharge"
  | "first_ride"
  | "merchant_signup"
  | "initiate_checkout";

interface ConversionData {
  value?: number;
  currency?: string;
  content_name?: string;
  [key: string]: any;
}

export function useConversionTracking() {
  const trackEvent = useCallback(
    (event: ConversionEvent, data: ConversionData = {}) => {
      const currency = data.currency || "BRL";

      switch (event) {
        case "complete_registration":
          window.fbq?.("track", "CompleteRegistration", data);
          window.gtag?.("event", "sign_up", { method: "email", ...data });
          window.ttq?.track("CompleteRegistration", data);
          window._tfa?.push({ notify: "event", name: "complete_registration" });
          break;

        case "first_recharge":
          window.fbq?.("track", "Purchase", {
            value: data.value,
            currency,
            content_name: "credit_recharge",
          });
          window.gtag?.("event", "purchase", {
            value: data.value,
            currency,
            transaction_id: data.transaction_id,
          });
          window.ttq?.track("CompletePayment", {
            value: data.value,
            currency,
          });
          window._tfa?.push({
            notify: "event",
            name: "purchase",
            revenue: data.value,
          });
          break;

        case "first_ride":
          window.fbq?.("track", "Purchase", {
            value: data.value,
            currency,
            content_name: "first_ride",
          });
          window.gtag?.("event", "purchase", {
            value: data.value,
            currency,
            items: [{ item_name: "ride" }],
          });
          window.ttq?.track("CompletePayment", {
            value: data.value,
            currency,
          });
          break;

        case "merchant_signup":
          window.fbq?.("track", "Lead", data);
          window.gtag?.("event", "generate_lead", data);
          window.ttq?.track("SubmitForm", data);
          break;

        case "initiate_checkout":
          window.fbq?.("track", "InitiateCheckout", data);
          window.gtag?.("event", "begin_checkout", data);
          window.ttq?.track("InitiateCheckout", data);
          break;
      }
    },
    []
  );

  return { trackEvent };
}
