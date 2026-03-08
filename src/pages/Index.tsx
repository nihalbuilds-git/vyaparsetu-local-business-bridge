import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useRef } from "react";
import { Users, CalendarCheck, IndianRupee, Megaphone, ArrowRight, Globe } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

const features: { icon: typeof Users; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Users, titleKey: "workersManagement", descKey: "workersManagementDesc" },
  { icon: CalendarCheck, titleKey: "dailyAttendance", descKey: "dailyAttendanceDesc" },
  { icon: IndianRupee, titleKey: "salaryCalculator", descKey: "salaryCalculatorDesc" },
  { icon: Megaphone, titleKey: "aiCampaignsFeature", descKey: "aiCampaignsDesc" },
];

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * 4,
    }))
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  // Mouse gradient follow
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY, opacity: 1 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  // Ripple on click
  const handleClick = useCallback((e: React.MouseEvent) => {
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 1200);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col bg-background overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Inline keyframes */}
      <style>{`
        @keyframes word-rise {
          0% { opacity: 0; transform: translateY(28px) scale(0.92); filter: blur(8px); }
          60% { opacity: 0.85; transform: translateY(6px) scale(0.98); filter: blur(1px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          25% { transform: translateY(-12px) translateX(6px); opacity: 0.5; }
          50% { transform: translateY(-6px) translateX(-4px); opacity: 0.3; }
          75% { transform: translateY(-18px) translateX(8px); opacity: 0.6; }
        }
        @keyframes ripple-expand {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(60); opacity: 0; }
        }
        @keyframes grid-fade {
          0% { stroke-dashoffset: 800; opacity: 0; }
          60% { opacity: 0.12; }
          100% { stroke-dashoffset: 0; opacity: 0.06; }
        }
        @keyframes subtle-glow {
          0%, 100% { opacity: 0.04; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.08); }
        }
        @keyframes corner-draw {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 0.2; transform: scale(1); }
        }
        @keyframes underline-grow {
          0% { width: 0; }
          100% { width: 100%; }
        }
        .word-animate {
          display: inline-block;
          opacity: 0;
          animation: word-rise 0.7s ease-out forwards;
        }
        .word-animate:hover {
          color: hsl(var(--primary));
          transform: translateY(-2px);
          transition: color 0.3s, transform 0.3s;
        }
      `}</style>

      {/* Background SVG grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <line
              x1="60" y1="0" x2="60" y2="60"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              strokeDashoffset="800"
              style={{ animation: "grid-fade 2.5s ease-out forwards" }}
            />
            <line
              x1="0" y1="60" x2="60" y2="60"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              strokeDashoffset="800"
              style={{ animation: "grid-fade 2.5s ease-out 0.3s forwards" }}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Ambient glow orbs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          top: "10%",
          left: "15%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)",
          animation: "subtle-glow 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          bottom: "5%",
          right: "10%",
          background: "radial-gradient(circle, hsl(var(--warning) / 0.05), transparent 70%)",
          animation: "subtle-glow 8s ease-in-out 2s infinite",
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: "hsl(var(--primary))",
            opacity: 0,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Corner decorative elements */}
      {[
        { top: 24, left: 24, borderW: "1px 0 0 1px" },
        { top: 24, right: 24, borderW: "1px 1px 0 0" },
        { bottom: 24, left: 24, borderW: "0 0 1px 1px" },
        { bottom: 24, right: 24, borderW: "0 1px 1px 0" },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute hidden md:block pointer-events-none"
          style={{
            width: 36,
            height: 36,
            ...pos,
            borderWidth: pos.borderW,
            borderStyle: "solid",
            borderColor: "hsl(var(--border))",
            opacity: 0,
            animation: `corner-draw 1s ease-out ${0.8 + i * 0.15}s forwards`,
          } as React.CSSProperties}
        />
      ))}

      {/* Mouse-follow gradient */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 600,
          height: 600,
          left: mousePos.x,
          top: mousePos.y,
          opacity: mousePos.opacity,
          background: "radial-gradient(circle, hsl(var(--primary) / 0.04), hsl(var(--muted) / 0.03), transparent 70%)",
          transform: "translate(-50%, -50%)",
          transition: "left 80ms linear, top 80ms linear, opacity 300ms ease-out",
          filter: "blur(40px)",
        }}
      />

      {/* Ripples */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="fixed pointer-events-none rounded-full"
          style={{
            width: 6,
            height: 6,
            left: r.x,
            top: r.y,
            background: "hsl(var(--primary) / 0.5)",
            animation: "ripple-expand 1.2s ease-out forwards",
          }}
        />
      ))}

      {/* Language toggle */}
      <div className="absolute top-5 right-5 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); setLang(lang === "en" ? "hi" : "en"); }}
          className="gap-2 backdrop-blur-sm bg-card/60 border-border/50 hover:bg-card/80 transition-all"
        >
          <Globe size={14} />
          {lang === "en" ? "हिन्दी" : "English"}
        </Button>
      </div>

      {/* Hero */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-20 text-center z-10">
        {/* Tagline above logo */}
        <p
          className="mb-6 text-xs tracking-[0.3em] uppercase text-muted-foreground"
          style={{ opacity: 0, animation: "word-rise 0.7s ease-out 0.2s forwards" }}
        >
          {lang === "en" ? "Business made simple" : "व्यापार को आसान बनाएं"}
        </p>

        {/* Logo */}
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg"
          style={{ opacity: 0, animation: "word-rise 0.6s ease-out 0.3s forwards" }}
        >
          <span className="text-4xl font-bold text-primary-foreground font-display">V</span>
        </div>

        {/* App name with word animation */}
        <h1 className="mb-3 text-4xl md:text-6xl font-bold font-display">
          {"VyaparSetu".split("").map((char, i) => (
            <span
              key={i}
              className="word-animate text-gradient-primary"
              style={{ animationDelay: `${0.4 + i * 0.05}s` }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Tagline with animated underline */}
        <div className="relative mb-10">
          <p className="max-w-lg text-base md:text-lg text-muted-foreground leading-relaxed">
            {t("heroTagline").split(" ").map((word, i) => (
              <span
                key={i}
                className="word-animate"
                style={{ animationDelay: `${0.9 + i * 0.06}s`, margin: "0 0.15em" }}
              >
                {word}
              </span>
            ))}
          </p>
          <div
            className="absolute -bottom-2 left-1/2 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)",
              width: 0,
              transform: "translateX(-50%)",
              animation: "underline-grow 1.5s ease-out 2.5s forwards",
            }}
          />
        </div>

        {/* CTA */}
        <div style={{ opacity: 0, animation: "word-rise 0.7s ease-out 2s forwards" }}>
          <Button
            onClick={(e) => { e.stopPropagation(); navigate("/login"); }}
            className="gradient-primary text-primary-foreground gap-2 px-8 py-3 text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("getStarted")} <ArrowRight size={16} />
          </Button>
        </div>

        {/* Features grid */}
        <div className="mt-20 grid max-w-2xl gap-5 sm:grid-cols-2">
          {features.map(({ icon: Icon, titleKey, descKey }, idx) => (
            <div
              key={titleKey}
              className="group relative rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 text-left transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1"
              style={{
                opacity: 0,
                animation: `word-rise 0.6s ease-out ${2.2 + idx * 0.15}s forwards`,
              }}
            >
              {/* Card hover glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.06), transparent 60%)" }}
              />
              <div className="relative">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-primary/10">
                  <Icon size={20} className="text-accent-foreground transition-colors group-hover:text-primary" />
                </div>
                <h3 className="font-semibold font-display mb-1 text-foreground">{t(titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom decorative text */}
        <p
          className="mt-16 text-[10px] tracking-[0.5em] uppercase text-muted-foreground/40"
          style={{ opacity: 0, animation: "word-rise 0.7s ease-out 3s forwards" }}
        >
          {lang === "en" ? "crafted for india" : "भारत के लिए बनाया गया"}
        </p>
      </div>
    </div>
  );
}
