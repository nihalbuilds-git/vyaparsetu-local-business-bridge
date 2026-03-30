import { useI18n } from "@/lib/i18n";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Github, Linkedin, Mail } from "lucide-react";

export default function LandingFooter() {
  const { t } = useI18n();
  const ref = useScrollReveal<HTMLElement>();

  return (
    <footer ref={ref} className="relative border-t border-border overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 opacity-50" style={{
        background: "radial-gradient(ellipse 80% 80% at 50% 100%, hsl(var(--primary) / 0.06), transparent 70%)"
      }} />

      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-[5%] py-10 sm:py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary grid place-items-center shadow-md">
                <span className="font-display font-extrabold text-primary-foreground text-sm">V</span>
              </div>
              <span className="font-display font-extrabold text-primary text-lg">VyaparSetu</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("footerTagline")}</p>
          </div>

          {/* Developer attribution */}
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground">
              Developed by <span className="text-gradient-primary font-extrabold">Nihal Yadav</span>
            </p>
            <p className="text-xs text-muted-foreground">{t("madeWithLove")}</p>
          </div>

          {/* Copyright */}
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-xs text-muted-foreground">© 2026 VyaparSetu</p>
            <p className="text-[11px] text-muted-foreground/60">All rights reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
