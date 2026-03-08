import { useI18n } from "@/lib/i18n";

export default function LandingFooter() {
  const { t } = useI18n();

  return (
    <footer className="flex items-center justify-between flex-wrap gap-4 px-[5%] py-10 border-t border-border">
      <span className="font-display font-extrabold text-primary text-lg">VyaparSetu</span>
      <p className="text-xs text-muted-foreground">© 2026 VyaparSetu · {t("footerTagline")}</p>
      <p className="text-xs text-muted-foreground">{t("madeWithLove")}</p>
    </footer>
  );
}
