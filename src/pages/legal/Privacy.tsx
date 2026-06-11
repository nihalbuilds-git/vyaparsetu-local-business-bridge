import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary grid place-items-center">
            <Shield size={20} className="text-primary-foreground" />
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 11, 2026</p>

        <div className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="font-bold text-xl mb-2">1. Introduction</h2>
            <p>VyaparSetu ("we", "us", "our") is a business management SaaS platform operated by Nihal Yadav. This Privacy Policy explains how we collect, use, store, and protect your information when you use our application.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account information:</strong> name, email, phone number (+91), business profile details.</li>
              <li><strong>Business data:</strong> workers, attendance, salary, khata (credit/debit), invoices, inventory, expenses, contacts.</li>
              <li><strong>Payment information:</strong> processed securely by Razorpay; we store transaction IDs and status only.</li>
              <li><strong>Usage data:</strong> device type, browser, IP address, log data for security and analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain VyaparSetu services.</li>
              <li>To process subscription payments through Razorpay.</li>
              <li>To send transactional emails (invoices, reminders, password resets).</li>
              <li>To improve and personalize features (e.g., AI assistant in Hindi/English/Hinglish).</li>
              <li>To comply with legal obligations under Indian law (DPDP Act, 2023).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">4. Data Storage & Security</h2>
            <p>All data is stored on secure cloud infrastructure with row-level security (RLS) ensuring multi-tenant isolation. Each business owner can access only their own data. We use industry-standard encryption in transit (HTTPS) and at rest.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">5. Sharing of Information</h2>
            <p>We do not sell your data. We share information only with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Razorpay</strong> — for payment processing.</li>
              <li><strong>Google AI (Gemini)</strong> — for AI assistant and marketing content generation (queries are not stored beyond session).</li>
              <li><strong>Legal authorities</strong> — when required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">6. Your Rights (DPDP Act 2023)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Right to access</strong> — download all your data from Profile → Privacy.</li>
              <li><strong>Right to correction</strong> — edit your data anytime from the app.</li>
              <li><strong>Right to erasure</strong> — permanently delete your account and all associated data from Profile → Privacy.</li>
              <li><strong>Right to grievance redressal</strong> — contact us below.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies for advertising.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">8. Children's Privacy</h2>
            <p>VyaparSetu is not intended for users under 18. We do not knowingly collect data from minors.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. The updated version will be posted on this page with a revised "Last updated" date.</p>
          </section>

          <section>
            <h2 className="font-bold text-xl mb-2">10. Contact / Grievance Officer</h2>
            <p><strong>Grievance Officer:</strong> Nihal Yadav<br/>
            <strong>Email:</strong> support@vyaparsetu.in<br/>
            We respond to all queries within 7 working days.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
