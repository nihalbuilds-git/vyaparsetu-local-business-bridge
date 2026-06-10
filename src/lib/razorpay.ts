// Razorpay checkout helper — loads the Checkout SDK and opens the modal.
declare global {
  interface Window {
    Razorpay?: any;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export interface OpenCheckoutArgs {
  keyId: string;
  orderId: string;
  amount: number; // paise
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  themeColor?: string;
  onSuccess: (resp: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
}

export const openRazorpayCheckout = async (args: OpenCheckoutArgs) => {
  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) throw new Error("Failed to load Razorpay SDK");

  const rzp = new window.Razorpay({
    key: args.keyId,
    amount: args.amount,
    currency: args.currency,
    name: args.name,
    description: args.description,
    order_id: args.orderId,
    prefill: args.prefill || {},
    theme: { color: args.themeColor || "#e27214" },
    handler: args.onSuccess,
    modal: { ondismiss: () => args.onDismiss?.() },
  });
  rzp.open();
};
