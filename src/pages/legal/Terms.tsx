import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center">
            <FileText size={20} className="text-primary-foreground" />
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl">Terms of Service</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 11, 2026</p>

        <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="font-bold text-xl mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account or using VyaparSetu, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">2. Eligibility</h2>
            <p>You must be at least 18 years old and legally capable of entering into a contract under Indian law to use VyaparSetu.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">3. Account Responsibility</h2>
            <p>You are responsible for keeping your credentials confidential. All activity under your account is your responsibility. Notify us immediately of any unauthorized access.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">4. Subscription & Payments</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Paid plans are billed monthly via Razorpay.</li>
              <li>Subscriptions auto-renew unless cancelled before the next billing cycle.</li>
              <li>Prices are in INR and inclusive of applicable GST.</li>
              <li>You can cancel anytime from your profile.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">5. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use VyaparSetu for any illegal or fraudulent activity.</li>
              <li>Upload malicious code, spam, or harmful content.</li>
              <li>Attempt to access other users' data or reverse-engineer the platform.</li>
              <li>Resell or sublicense the service without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">6. Intellectual Property</h2>
            <p>All software, branding, and content of VyaparSetu are owned by Nihal Yadav. You retain ownership of the business data you create within the platform.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">7. Service Availability</h2>
            <p>We strive for 99% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be communicated in advance where possible.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">8. Limitation of Liability</h2>
            <p>VyaparSetu is provided "as is". We are not liable for any indirect, incidental, or consequential damages arising from use of the platform, including loss of data or business interruption. Maximum liability is limited to the amount you paid in the last 3 months.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">9. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms. You may close your account anytime from Profile → Privacy.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">10. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts in Uttar Pradesh, India.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">11. Contact</h2>
            <p>Questions? Email <strong>support@vyaparsetu.in</strong>.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
