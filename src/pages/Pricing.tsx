import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "free",
    icon: Zap,
    priceEn: "₹0",
    priceHi: "₹0",
    periodEn: "forever",
    periodHi: "हमेशा",
    featuresEn: ["5 Workers", "Basic Attendance", "1 Campaign/month", "Khata Book", "Basic Inventory"],
    featuresHi: ["5 कर्मचारी", "बेसिक उपस्थिति", "1 अभियान/माह", "खाता बुक", "बेसिक इन्वेंटरी"],
    gradient: "from-muted to-muted/50",
  },
  {
    id: "pro",
    icon: Sparkles,
    priceEn: "₹299",
    priceHi: "₹299",
    periodEn: "/month",
    periodHi: "/माह",
    featuresEn: ["25 Workers", "Full Analytics Dashboard", "Unlimited Campaigns", "GST Invoices", "Expense Tracker", "WhatsApp Sharing", "Priority Support"],
    featuresHi: ["25 कर्मचारी", "पूरा एनालिटिक्स डैशबोर्ड", "असीमित अभियान", "GST बिल", "आय-व्यय ट्रैकर", "WhatsApp शेयरिंग", "प्राथमिकता सहायता"],
    gradient: "from-primary/15 to-primary/5",
    popular: true,
  },
  {
    id: "business",
    icon: Crown,
    priceEn: "₹799",
    priceHi: "₹799",
    periodEn: "/month",
    periodHi: "/माह",
    featuresEn: ["Unlimited Workers", "Multi-Store Support", "All Pro Features", "Advanced Reports", "Dedicated Account Manager", "Custom Branding", "API Access"],
    featuresHi: ["असीमित कर्मचारी", "मल्टी-स्टोर सपोर्ट", "सभी Pro सुविधाएँ", "उन्नत रिपोर्ट", "समर्पित अकाउंट मैनेजर", "कस्टम ब्रांडिंग", "API एक्सेस"],
    gradient: "from-amber-500/15 to-amber-500/5",
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_subscriptions").select("plan").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.plan) setCurrentPlan(data.plan);
      setLoading(false);
    });
  }, [user]);

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) return;
    if (planId === "free") {
      // Downgrade
      if (!user) return;
      await supabase.from("user_subscriptions").upsert({ user_id: user.id, plan: "free" }, { onConflict: "user_id" });
      setCurrentPlan("free");
      toast({ title: lang === "hi" ? "प्लान बदला गया" : "Plan changed" });
      return;
    }
    // For paid plans - show coming soon
    toast({
      title: lang === "hi" ? "जल्द आ रहा है!" : "Coming Soon!",
      description: lang === "hi" ? "भुगतान एकीकरण जल्द ही उपलब्ध होगा। अभी सभी सुविधाएँ मुफ़्त हैं!" : "Payment integration coming soon. All features are free for now!",
    });
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold font-display">{t("pricingTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("pricingSubtext")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
          {plans.map(plan => {
            const isCurrentPlan = currentPlan === plan.id;
            const features = lang === "hi" ? plan.featuresHi : plan.featuresEn;
            const price = lang === "hi" ? plan.priceHi : plan.priceEn;
            const period = lang === "hi" ? plan.periodHi : plan.periodEn;
            const nameKey = `plan_${plan.id}` as any;

            return (
              <Card key={plan.id} className={`rounded-2xl border-border/40 relative overflow-hidden transition-all hover:shadow-lg ${plan.popular ? "border-primary/50 shadow-md" : ""}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 gradient-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    {lang === "hi" ? "लोकप्रिय" : "POPULAR"}
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50`} />
                <CardContent className="relative p-6 space-y-5">
                  <div className="text-center">
                    <div className={`inline-flex rounded-xl p-3 mb-3 ${plan.popular ? "gradient-primary" : "bg-muted"}`}>
                      <plan.icon size={24} className={plan.popular ? "text-primary-foreground" : "text-foreground"} />
                    </div>
                    <h3 className="font-bold font-display text-lg capitalize">{plan.id}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-extrabold font-display">{price}</span>
                      <span className="text-muted-foreground text-sm">{period}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check size={16} className="text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading}
                    className={`w-full ${plan.popular ? "gradient-primary text-primary-foreground" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {isCurrentPlan
                      ? (lang === "hi" ? "वर्तमान प्लान" : "Current Plan")
                      : (lang === "hi" ? "चुनें" : "Select Plan")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {lang === "hi" ? "✓ सभी सुविधाएँ अभी मुफ़्त हैं · भुगतान जल्द ही उपलब्ध होगा" : "✓ All features are free during beta · Payment integration coming soon"}
        </p>
      </div>
    </AppLayout>
  );
}
