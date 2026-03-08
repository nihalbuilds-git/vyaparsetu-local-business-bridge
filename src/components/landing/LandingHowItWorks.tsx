import { useI18n } from "@/lib/i18n";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const steps = [
  { num: "1", titleKey: "step1Title" as const, descKey: "step1Desc" as const },
  { num: "2", titleKey: "step2Title" as const, descKey: "step2Desc" as const },
  { num: "3", titleKey: "step3Title" as const, descKey: "step3Desc" as const },
];

export default function LandingHowItWorks() {
  const { t } = useI18n();
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} id="how" className="relative py-16 sm:py-24 px-4 sm:px-[5%] text-primary-foreground overflow-hidden" style={{
      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(24 85% 32%))"
    }}>
      <div className="absolute -top-1/2 -right-[10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.04)" }} />

      <p className="reveal-card opacity-0 text-center text-xs font-bold tracking-[0.15em] uppercase text-primary-foreground/70 mb-2 sm:mb-3">
        {t("threeSimpleSteps")}
      </p>
      <h2 className="reveal-card opacity-0 text-center font-display font-extrabold text-primary-foreground mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl">
        {t("gettingStartedEasy")}
      </h2>
      <p className="reveal-card opacity-0 text-center text-primary-foreground/70 max-w-[480px] mx-auto mb-8 sm:mb-12 leading-relaxed text-sm sm:text-base px-2">
        {t("stepsSubtext")}
      </p>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center max-w-[900px] mx-auto relative z-10">
        {steps.map((step, idx) => (
          <div key={step.num} className="reveal-card opacity-0 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[240px] text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15 grid place-items-center mx-auto mb-3 sm:mb-4 transition-transform duration-500 hover:scale-110">
                <span className="font-display font-extrabold text-lg sm:text-xl text-primary-foreground">{step.num}</span>
              </div>
              <h3 className="font-display font-bold text-primary-foreground mb-1 text-sm sm:text-base">{t(step.titleKey)}</h3>
              <p className="text-xs sm:text-sm text-primary-foreground/70 leading-relaxed">{t(step.descKey)}</p>
            </div>
            {idx < steps.length - 1 && (
              <>
                <span className="hidden sm:block text-2xl text-primary-foreground/30">→</span>
                <span className="sm:hidden text-xl text-primary-foreground/30">↓</span>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
