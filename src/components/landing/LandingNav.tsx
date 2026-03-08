import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { Globe, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function LandingNav() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] py-4 backdrop-blur-xl border-b transition-all duration-300 ${
      scrolled ? "bg-background/95 border-border shadow-sm" : "bg-background/60 border-transparent"
    }`}>
      <a href="#" className="flex items-center gap-2.5 no-underline" onClick={(e) => e.preventDefault()}>
        <div className="w-[38px] h-[38px] rounded-[10px] gradient-primary grid place-items-center shadow-lg">
          <span className="font-display font-extrabold text-primary-foreground text-lg">V</span>
        </div>
        <span className="font-display font-extrabold text-lg text-primary">VyaparSetu</span>
      </a>

      <ul className="hidden md:flex gap-8 list-none">
        <li><a href="#features" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors no-underline">{t("navFeatures")}</a></li>
        <li><a href="#how" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors no-underline">{t("navHowItWorks")}</a></li>
        <li><a href="#testimonials" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors no-underline">{t("navReviews")}</a></li>
      </ul>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.documentElement.classList.toggle("dark")}
          className="backdrop-blur-sm bg-card/60 border-border/50"
        >
          <Sun size={14} className="dark:hidden" />
          <Moon size={14} className="hidden dark:block" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
          className="gap-1.5 backdrop-blur-sm bg-card/60 border-border/50"
        >
          <Globe size={14} />
          {lang === "en" ? "हिन्दी" : "English"}
        </Button>
        <Button
          onClick={() => navigate("/login")}
          className="gradient-primary text-primary-foreground rounded-full px-5 font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          {t("getStartedFree")}
        </Button>
      </div>
    </nav>
  );
}
