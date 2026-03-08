import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { Globe, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function LandingNav() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
      scrolled ? "bg-background/95 border-border shadow-sm" : "bg-background/60 border-transparent"
    }`}>
      <div className="flex items-center justify-between px-4 sm:px-[5%] py-3 sm:py-4">
        <a href="#" className="flex items-center gap-2 no-underline" onClick={(e) => e.preventDefault()}>
          <div className="w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-[10px] gradient-primary grid place-items-center shadow-lg">
            <span className="font-display font-extrabold text-primary-foreground text-base sm:text-lg">V</span>
          </div>
          <span className="font-display font-extrabold text-base sm:text-lg text-primary">VyaparSetu</span>
        </a>

        {/* Desktop nav links */}
        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="#features" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors no-underline">{t("navFeatures")}</a></li>
          <li><a href="#how" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors no-underline">{t("navHowItWorks")}</a></li>
          <li><a href="#testimonials" className="text-muted-foreground font-medium text-sm hover:text-primary transition-colors no-underline">{t("navReviews")}</a></li>
        </ul>

        {/* Desktop controls */}
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => document.documentElement.classList.toggle("dark")} className="backdrop-blur-sm bg-card/60 border-border/50">
            <Sun size={14} className="dark:hidden" />
            <Moon size={14} className="hidden dark:block" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "hi" : "en")} className="gap-1.5 backdrop-blur-sm bg-card/60 border-border/50">
            <Globe size={14} />
            {lang === "en" ? "हिन्दी" : "English"}
          </Button>
          <Button onClick={() => navigate("/login")} className="gradient-primary text-primary-foreground rounded-full px-5 font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            {t("getStartedFree")}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2 text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-fade-in">
          <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-primary no-underline py-1">{t("navFeatures")}</a>
          <a href="#how" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-primary no-underline py-1">{t("navHowItWorks")}</a>
          <a href="#testimonials" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-primary no-underline py-1">{t("navReviews")}</a>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => document.documentElement.classList.toggle("dark")}>
              <Sun size={14} className="dark:hidden" /><Moon size={14} className="hidden dark:block" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "hi" : "en")} className="gap-1.5">
              <Globe size={14} />{lang === "en" ? "हिन्दी" : "English"}
            </Button>
          </div>
          <Button onClick={() => { navigate("/login"); setMenuOpen(false); }} className="w-full gradient-primary text-primary-foreground rounded-full font-semibold text-sm shadow-md">
            {t("getStartedFree")}
          </Button>
        </div>
      )}
    </nav>
  );
}
