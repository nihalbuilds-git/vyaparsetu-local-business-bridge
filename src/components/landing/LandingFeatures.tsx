import { useI18n } from "@/lib/i18n";
import { Users, CalendarCheck, IndianRupee, Megaphone, FileText, Shield } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const features: { icon: typeof Users; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Users, titleKey: "workersManagement", descKey: "workersManagementDesc" },
  { icon: CalendarCheck, titleKey: "dailyAttendance", descKey: "dailyAttendanceDesc" },
  { icon: IndianRupee, titleKey: "salaryCalculator", descKey: "salaryCalculatorDesc" },
  { icon: Megaphone, titleKey: "aiCampaignsFeature", descKey: "aiCampaignsDesc" },
  { icon: FileText, titleKey: "reportsHistory", descKey: "reportsHistoryDesc" },
  { icon: Shield, titleKey: "safeSecure", descKey: "safeSecureDesc" },
];

export default function LandingFeatures() {
  const { t } = useI18n();
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} id="features" className="py-16 sm:py-24 px-4 sm:px-[5%] max-w-[1100px] mx-auto">
      <p className="reveal-card opacity-0 text-center text-sm sm:text-base font-extrabold tracking-[0.15em] uppercase text-primary mb-2 sm:mb-3">
        {t("whatYouGet")}
      </p>
      <h2 className="reveal-card opacity-0 text-center font-display font-extrabold text-foreground mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl">
        {t("everythingInOneApp")}
        <span className="block mx-auto mt-2 h-1 w-16 rounded-full bg-primary animate-[scale-in_0.6s_ease-out_forwards] origin-center" />
      </h2>
      </h2>
      <p className="reveal-card opacity-0 text-center text-muted-foreground text-sm sm:text-base max-w-[480px] mx-auto mb-10 sm:mb-14 leading-relaxed px-2">
        {t("featuresSubtext")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {features.map(({ icon: Icon, titleKey, descKey }) => (
          <div
            key={titleKey}
            className="reveal-card opacity-0 group relative bg-card border border-border rounded-2xl sm:rounded-[20px] p-6 sm:p-8 transition-all duration-300 cursor-default overflow-hidden hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/20"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="mb-3 sm:mb-4 w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-xl sm:rounded-[14px] bg-accent grid place-items-center transition-all group-hover:gradient-primary">
              <Icon size={22} className="text-accent-foreground transition-colors group-hover:text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-foreground text-base sm:text-lg mb-1">{t(titleKey)}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
