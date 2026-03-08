import { useI18n } from "@/lib/i18n";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const testimonials = [
  { textKey: "testimonial1" as const, nameKey: "testimonial1Name" as const, roleKey: "testimonial1Role" as const, initial: "R" },
  { textKey: "testimonial2" as const, nameKey: "testimonial2Name" as const, roleKey: "testimonial2Role" as const, initial: "S" },
  { textKey: "testimonial3" as const, nameKey: "testimonial3Name" as const, roleKey: "testimonial3Role" as const, initial: "M" },
];

export default function LandingTestimonials() {
  const { t } = useI18n();
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} id="testimonials" className="py-16 sm:py-24 px-4 sm:px-[5%] max-w-[1100px] mx-auto">
      <p className="reveal-card opacity-0 text-center text-sm sm:text-base font-extrabold tracking-[0.15em] uppercase text-primary mb-2 sm:mb-3">
        {t("whatPeopleSay")}
      </p>
      <h2 className="reveal-card opacity-0 text-center font-display font-extrabold text-foreground mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl">
        {t("realStories")}
      </h2>
      <p className="reveal-card opacity-0 text-center text-muted-foreground text-sm sm:text-base max-w-[480px] mx-auto mb-10 sm:mb-14 leading-relaxed px-2">
        {t("testimonialSubtext")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {testimonials.map((item, idx) => (
          <div
            key={idx}
            className="reveal-card opacity-0 bg-card border border-border rounded-2xl sm:rounded-[20px] p-5 sm:p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-primary text-sm sm:text-base mb-2 sm:mb-3">★★★★★</div>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed mb-4 sm:mb-5 italic">"{t(item.textKey)}"</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gradient-primary grid place-items-center font-extrabold text-primary-foreground text-xs sm:text-sm shrink-0">
                {item.initial}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-foreground truncate">{t(item.nameKey)}</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{t(item.roleKey)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
