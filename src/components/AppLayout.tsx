import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { LayoutDashboard, Users, CalendarCheck, IndianRupee, Megaphone, User, LogOut, Globe, BookUser, CreditCard, Package, FileText, Wallet, Clock, Store, Crown, Menu } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navItems: { to: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }[] = [
  { to: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/workers", labelKey: "workers", icon: Users },
  { to: "/attendance", labelKey: "attendance", icon: CalendarCheck },
  { to: "/salary", labelKey: "salary", icon: IndianRupee },
  { to: "/khata", labelKey: "khataBook", icon: CreditCard },
  { to: "/inventory", labelKey: "inventory", icon: Package },
  { to: "/invoices", labelKey: "invoices", icon: FileText },
  { to: "/expenses", labelKey: "expenseTracker", icon: Wallet },
  { to: "/worker-advances", labelKey: "workerAdvances", icon: Clock },
  { to: "/campaign", labelKey: "aiCampaigns", icon: Megaphone },
  { to: "/contacts", labelKey: "contacts", icon: BookUser },
  
  { to: "/stores", labelKey: "storesTitle", icon: Store },
  { to: "/pricing", labelKey: "pricingTitle", icon: Crown },
  { to: "/business-profile", labelKey: "profile", icon: User },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const toggleLang = () => setLang(lang === "en" ? "hi" : "en");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col gradient-secondary p-4">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <span className="text-lg font-bold text-primary-foreground font-display">V</span>
          </div>
          <span className="text-xl font-bold text-secondary-foreground font-display">VyaparSetu</span>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === to
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon size={18} />
              {t(labelKey)}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 mt-auto">
          <Button variant="ghost" onClick={toggleLang} className="justify-start gap-3 text-sidebar-foreground w-full">
            <Globe size={18} />
            {lang === "en" ? "हिन्दी" : "English"}
          </Button>
          <Button variant="ghost" onClick={handleSignOut} className="justify-start gap-3 text-sidebar-foreground hover:text-destructive w-full">
            <LogOut size={18} />
            {t("signOut")}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <span className="text-sm font-bold text-primary-foreground font-display">V</span>
            </div>
            <span className="font-bold font-display">VyaparSetu</span>
          </div>
          <div className="flex gap-1">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={toggleLang}>
              <Globe size={16} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut size={16} />
            </Button>
          </div>
        </header>

        {/* Mobile bottom nav - key actions */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {[
            { to: "/dashboard", labelKey: "dashboard" as TranslationKey, icon: LayoutDashboard },
            { to: "/attendance", labelKey: "attendance" as TranslationKey, icon: CalendarCheck },
            { to: "/khata", labelKey: "khataBook" as TranslationKey, icon: CreditCard },
            { to: "/invoices", labelKey: "invoices" as TranslationKey, icon: FileText },
            { to: "/expenses", labelKey: "expenseTracker" as TranslationKey, icon: Wallet },
          ].map(({ to, labelKey, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                pathname === to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} />
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
