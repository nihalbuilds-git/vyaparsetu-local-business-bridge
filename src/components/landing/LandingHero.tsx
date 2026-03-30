import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, Users, IndianRupee, CalendarCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingHero() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const stats = [
    { icon: Users, label: "Workers", value: "∞" },
    { icon: IndianRupee, label: "GST Invoices", value: "✓" },
    { icon: CalendarCheck, label: "Attendance", value: "1-tap" },
    { icon: FileText, label: "Khata Book", value: "Digital" },
  ];

  return (
    <section className="relative min-h-[55vh] sm:min-h-[60vh] flex flex-col items-center justify-center text-center px-4 sm:px-[5%] pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.15), transparent 70%),
            radial-gradient(ellipse 50% 50% at 10% 80%, hsl(var(--primary) / 0.08), transparent 60%),
            radial-gradient(ellipse 50% 50% at 90% 70%, hsl(var(--warning) / 0.1), transparent 60%)
          `
        }} />
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-[10%] w-2 h-2 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute top-32 right-[15%] w-3 h-3 rounded-full bg-primary/15 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-[20%] w-2.5 h-2.5 rounded-full bg-primary/10 animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Badge */}
        <div className="animate-fade-up mb-4 sm:mb-5 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
          <span className="text-xs sm:text-sm font-semibold text-primary">🇮🇳 Made for Indian Businesses</span>
        </div>

        <h1 className="font-display font-extrabold text-primary leading-none tracking-tight animate-fade-up text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ letterSpacing: "-0.02em", animationDelay: "0.1s" }}
        >
          VyaparSetu
        </h1>

        <p className="mt-4 sm:mt-6 max-w-md sm:max-w-xl text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed animate-fade-up px-2"
          style={{ animationDelay: "0.25s" }}
        >
          {t("heroTagline")}
        </p>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto animate-fade-up px-4 sm:px-0" style={{ animationDelay: "0.4s" }}>
          <Button
            onClick={() => navigate("/login")}
            className="gradient-primary text-primary-foreground gap-2 px-6 sm:px-8 py-3 text-sm sm:text-base rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          >
            {t("getStarted")} <ArrowRight size={18} />
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-full px-6 sm:px-7 py-3 text-sm sm:text-base font-semibold border-primary/30 text-primary hover:bg-accent transition-all w-full sm:w-auto"
          >
            {t("navFeatures")}
          </Button>
        </div>

        {/* Quick stats strip */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 animate-fade-up w-full max-w-lg sm:max-w-2xl" style={{ animationDelay: "0.6s" }}>
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors">
              <Icon size={18} className="text-primary" />
              <span className="text-xs font-bold text-foreground">{value}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
