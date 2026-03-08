import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingHero() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <section className="relative min-h-[45vh] sm:min-h-[50vh] flex flex-col items-center justify-center text-center px-4 sm:px-[5%] pt-24 sm:pt-28 pb-10 sm:pb-12 overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.12), transparent 70%),
            radial-gradient(ellipse 40% 40% at 10% 80%, hsl(var(--primary) / 0.08), transparent 60%),
            radial-gradient(ellipse 40% 40% at 90% 70%, hsl(var(--warning) / 0.1), transparent 60%)
          `
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="font-display font-extrabold text-primary leading-none tracking-tight animate-fade-up text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          VyaparSetu
        </h1>

        <p className="mt-4 sm:mt-6 max-w-md sm:max-w-lg text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed animate-fade-up px-2"
          style={{ animationDelay: "0.2s" }}
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
      </div>
    </section>
  );
}
