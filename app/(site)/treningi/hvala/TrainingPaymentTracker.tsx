"use client";

import { useEffect } from "react";
import { trackPaymentComplete } from "@/lib/analytics";

type Props = {
  transactionId: string;
  value: number;
  currency: string;
};

export function TrainingPaymentTracker({ transactionId, value, currency }: Props) {
  useEffect(() => {
    const storageKey = `apnea_purchase_${transactionId}`;
    if (window.localStorage.getItem(storageKey)) return;

    trackPaymentComplete({ transaction_id: transactionId, value, currency });
    window.localStorage.setItem(storageKey, "true");
  }, [currency, transactionId, value]);

  return null;
}
