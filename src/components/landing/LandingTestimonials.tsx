import { useI18n } from "@/lib/i18n";
import { useEffect, useRef } from "react";

const testimonials = [
  { textKey: "testimonial1" as const, nameKey: "testimonial1Name" as const, roleKey: "testimonial1Role" as const, initial: "R" },
  { textKey: "testimonial2" as const, nameKey: "testimonial2Name" as const, roleKey: "testimonial2Role" as const, initial: "S" },
  { textKey: "testimonial3" as const, nameKey: "testimonial3Name" as const, roleKey: "testimonial3Role" as const, initial: "M" },
];

export default function LandingTestimonials() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    const els = sectionRef.current?.querySelectorAll(".reveal-card");
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="testimonials" className="py-24 px-[5%] max-w-[1100px] mx-auto">
      <p className="text-center text-xs font-bold tracking-[0.15em] uppercase text-primary mb-3 reveal-card opacity-0">
        {t("whatPeopleSay")}
      </p>
      <h2 className="text-center font-display font-extrabold text-foreground mb-3 reveal-card opacity-0" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
        {t("realStories")}
      </h2>
      <p className="text-center text-muted-foreground max-w-[480px] mx-auto mb-14 leading-relaxed reveal-card opacity-0">
        {t("testimonialSubtext")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((item, idx) => (
          <div
            key={idx}
            className="reveal-card opacity-0 bg-card border border-border rounded-[20px] p-7 transition-all"
            style={{ transitionDelay: `${idx * 0.05}s` }}
          >
            <div className="text-primary text-base mb-3">★★★★★</div>
            <p className="text-sm text-foreground leading-relaxed mb-5 italic">"{t(item.textKey)}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary grid place-items-center font-extrabold text-primary-foreground text-sm">
                {item.initial}
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">{t(item.nameKey)}</div>
                <div className="text-xs text-muted-foreground">{t(item.roleKey)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
