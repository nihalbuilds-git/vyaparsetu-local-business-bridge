import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export default function LandingCTA() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-24 px-4 sm:px-[5%] text-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-accent" />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 60% 60% at 50% 50%, hsl(var(--primary) / 0.08), transparent 70%)"
      }} />

      <div className="relative z-10">
        <div className="reveal-card opacity-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <Sparkles size={12} />
          100% Free to Start
        </div>
        <h2 className="reveal-card opacity-0 font-display font-extrabold text-foreground mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl px-2">
          {t("startTodayFree")}
        </h2>
        <p className="reveal-card opacity-0 text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto px-2">{t("ctaSubtext")}</p>
        <div className="reveal-card opacity-0">
          <Button
            onClick={() => navigate("/login")}
            className="gradient-primary text-primary-foreground gap-2 px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto"
          >
            {t("registerNow")} <ArrowRight size={18} />
          </Button>
        </div>
        <p className="reveal-card opacity-0 mt-3 sm:mt-4 text-[11px] sm:text-xs text-muted-foreground px-2">{t("ctaNote")}</p>
      </div>
    </section>
  );
}
