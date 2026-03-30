import { useI18n } from "@/lib/i18n";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export default function LandingFooter() {
  const { t } = useI18n();
  const ref = useScrollReveal<HTMLElement>();

  return (
    <footer ref={ref} className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-4 sm:px-[5%] py-8 sm:py-10 border-t border-border text-center sm:text-left">
      <span className="reveal-card opacity-0 font-display font-extrabold text-primary text-lg">VyaparSetu</span>
      <p className="reveal-card opacity-0 text-xs text-muted-foreground">© 2026 VyaparSetu · {t("footerTagline")}</p>
      <p className="reveal-card opacity-0 text-xs text-muted-foreground">
        {t("madeWithLove")} · Developed by <span className="font-semibold text-foreground">Nihal Yadav</span>
      </p>
    </footer>
  );
}
