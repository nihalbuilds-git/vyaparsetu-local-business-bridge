import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function Refund() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center">
            <RotateCcw size={20} className="text-primary-foreground" />
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl">Refund & Cancellation Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 11, 2026</p>

        <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="font-bold text-xl mb-2">1. Overview</h2>
            <p>This policy explains refunds and cancellations for VyaparSetu paid subscriptions purchased through Razorpay.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">2. 7-Day Money-Back Guarantee</h2>
            <p>If you are not satisfied with your paid subscription, you can request a full refund within <strong>7 days</strong> of the initial purchase. After 7 days, no refunds will be issued for that billing cycle.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">3. How to Request a Refund</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Email <strong>support@vyaparsetu.in</strong> with your registered email and Razorpay payment ID.</li>
              <li>Mention the reason for the refund.</li>
              <li>We respond within 2 working days.</li>
              <li>Approved refunds are processed within 5–7 working days to the original payment method.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">4. Cancellation</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You can cancel your subscription anytime from Profile → Subscription.</li>
              <li>Cancellation stops future renewals. You retain access until the end of the current billing cycle.</li>
              <li>No partial refunds for unused days after the 7-day window.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">5. Non-Refundable Items</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Renewals after the first billing cycle.</li>
              <li>Subscriptions cancelled due to violation of Terms of Service.</li>
              <li>Add-on services or one-time purchases (if any) marked as non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">6. Failed Payments</h2>
            <p>If a payment fails or is duplicate-charged by Razorpay, contact us within 30 days with the transaction reference. We will verify and refund the duplicate charge.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">7. Contact</h2>
            <p>For any refund-related queries: <strong>support@vyaparsetu.in</strong></p>
          </section>
        </div>
      </div>
    </main>
  );
}
