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
    <section ref={sectionRef} id="features" className="py-24 px-[5%] max-w-[1100px] mx-auto">
      <p className="reveal-card opacity-0 text-center text-xs font-bold tracking-[0.15em] uppercase text-primary mb-3">
        {t("whatYouGet")}
      </p>
      <h2 className="reveal-card opacity-0 text-center font-display font-extrabold text-foreground mb-3"
        style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
      >
        {t("everythingInOneApp")}
      </h2>
      <p className="reveal-card opacity-0 text-center text-muted-foreground max-w-[480px] mx-auto mb-14 leading-relaxed">
        {t("featuresSubtext")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, titleKey, descKey }) => (
          <div
            key={titleKey}
            className="reveal-card opacity-0 group relative bg-card border border-border rounded-[20px] p-8 transition-all duration-300 cursor-default overflow-hidden hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/20"
          >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="mb-4 w-[52px] h-[52px] rounded-[14px] bg-accent grid place-items-center transition-all group-hover:gradient-primary">
              <Icon size={24} className="text-accent-foreground transition-colors group-hover:text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-foreground text-lg mb-1">{t(titleKey)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
