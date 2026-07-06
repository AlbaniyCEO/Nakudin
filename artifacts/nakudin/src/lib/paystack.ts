type PaystackSetupOptions = {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: Record<string, unknown>;
  onSuccess: (txn: { reference?: string; ref?: string }) => void;
  onCancel?: () => void;
};

declare global {
  interface Window {
    PaystackPop?: {
      setup?: (opts: PaystackSetupOptions) => { openIframe: () => void };
      new?: () => { newTransaction: (opts: PaystackSetupOptions) => void };
    };
  }
}

/**
 * Opens Paystack inline checkout while tolerating both the older v1 `setup`
 * API and the newer `newTransaction` API. This keeps billing screens from
 * breaking if the Paystack script URL changes between v1/v2.
 */
export function openPaystackCheckout(options: PaystackSetupOptions) {
  const paystack = window.PaystackPop;

  if (!paystack) {
    throw new Error("Paystack is not loaded.");
  }

  if (typeof paystack.setup === "function") {
    paystack.setup(options).openIframe();
    return;
  }

  try {
    const instance = new (paystack as any)();
    if (typeof instance.newTransaction === "function") {
      instance.newTransaction(options);
      return;
    }
  } catch {
    // Fall through to a clear error below.
  }

  throw new Error("Unsupported Paystack inline checkout version.");
}
