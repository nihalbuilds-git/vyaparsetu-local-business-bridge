import { useI18n } from "@/lib/i18n";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export default function LandingFooter() {
  const { t } = useI18n();
  const ref = useScrollReveal<HTMLElement>();

  return (
    <footer ref={ref} className="flex items-center justify-between flex-wrap gap-4 px-[5%] py-10 border-t border-border">
      <span className="reveal-card opacity-0 font-display font-extrabold text-primary text-lg">VyaparSetu</span>
      <p className="reveal-card opacity-0 text-xs text-muted-foreground">© 2026 VyaparSetu · {t("footerTagline")}</p>
      <p className="reveal-card opacity-0 text-xs text-muted-foreground">{t("madeWithLove")}</p>
    </footer>
  );
}
