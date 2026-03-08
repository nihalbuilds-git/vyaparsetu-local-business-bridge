import { useI18n } from "@/lib/i18n";

const steps = [
  { num: "1", titleKey: "step1Title" as const, descKey: "step1Desc" as const },
  { num: "2", titleKey: "step2Title" as const, descKey: "step2Desc" as const },
  { num: "3", titleKey: "step3Title" as const, descKey: "step3Desc" as const },
];

export default function LandingHowItWorks() {
  const { t } = useI18n();

  return (
    <section id="how" className="relative py-24 px-[5%] text-primary-foreground overflow-hidden" style={{
      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(24 85% 32%))"
    }}>
      {/* Decorative circle */}
      <div className="absolute -top-1/2 -right-[10%] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.04)" }} />

      <p className="text-center text-xs font-bold tracking-[0.15em] uppercase text-primary-foreground/70 mb-3">
        {t("threeSimpleSteps")}
      </p>
      <h2 className="text-center font-display font-extrabold text-primary-foreground mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
        {t("gettingStartedEasy")}
      </h2>
      <p className="text-center text-primary-foreground/70 max-w-[480px] mx-auto mb-12 leading-relaxed">
        {t("stepsSubtext")}
      </p>

      <div className="flex flex-wrap gap-4 justify-center max-w-[900px] mx-auto relative z-10">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center gap-4">
            <div className="flex-1 min-w-[200px] max-w-[240px] text-center p-6">
              <div className="w-[52px] h-[52px] rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/15 grid place-items-center mx-auto mb-4">
                <span className="font-display font-extrabold text-xl text-primary-foreground">{step.num}</span>
              </div>
              <h3 className="font-display font-bold text-primary-foreground mb-1">{t(step.titleKey)}</h3>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">{t(step.descKey)}</p>
            </div>
            {idx < steps.length - 1 && (
              <span className="hidden sm:block text-2xl text-primary-foreground/30">→</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
