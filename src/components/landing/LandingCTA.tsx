import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export default function LandingCTA() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="py-24 px-[5%] text-center bg-accent border-y border-border">
      <h2 className="reveal-card opacity-0 font-display font-extrabold text-foreground mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
        {t("startTodayFree")}
      </h2>
      <p className="reveal-card opacity-0 text-muted-foreground text-base mb-8">{t("ctaSubtext")}</p>
      <div className="reveal-card opacity-0">
        <Button
          onClick={() => navigate("/login")}
          className="gradient-primary text-primary-foreground gap-2 px-10 py-4 text-lg rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
        >
          {t("registerNow")} <ArrowRight size={18} />
        </Button>
      </div>
      <p className="reveal-card opacity-0 mt-4 text-xs text-muted-foreground">{t("ctaNote")}</p>
    </section>
  );
}
