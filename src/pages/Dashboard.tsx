import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import Onboarding from "@/components/Onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Megaphone, Users, History, CalendarCheck, IndianRupee,
  BarChart3, ArrowRight, TrendingUp, Clock, Sparkles,
  FileText, CreditCard, Wallet, Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import BusinessInsights from "@/components/dashboard/BusinessInsights";

interface Stats {
  totalWorkers: number;
  attendancePercent: number;
  monthlySalary: number;
  totalCampaigns: number;
}

interface BusinessHealth {
  khataBalance: number;
  lowStockCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

function getGreeting(lang: string): string {
  const h = new Date().getHours();
  if (lang === "hi") {
    if (h < 12) return "सुप्रभात";
    if (h < 17) return "नमस्कार";
    return "शुभ संध्या";
  }
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalWorkers: 0, attendancePercent: 0, monthlySalary: 0, totalCampaigns: 0 });
  const [health, setHealth] = useState<BusinessHealth>({ khataBalance: 0, lowStockCount: 0, monthlyIncome: 0, monthlyExpense: 0 });

  const load = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id, name").eq("owner_id", user.id).maybeSingle();
    if (biz?.name) {
      setShopName(biz.name);
    } else {
      setNeedsOnboarding(true);
      setLoading(false);
      return;
    }

    const { data: workers } = await supabase.from("workers").select("id, daily_salary").eq("user_id", user.id);
    const totalWorkers = workers?.length || 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const { data: todayAtt } = await supabase.from("attendance").select("status").eq("user_id", user.id).eq("date", todayStr);
    const presentToday = (todayAtt || []).filter(a => a.status === "present" || a.status === "half_day").length;
    const attendancePercent = totalWorkers > 0 ? Math.round((presentToday / totalWorkers) * 100) : 0;

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const { data: monthAtt } = await supabase.from("attendance").select("worker_id, status").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd);

    let monthlySalary = 0;
    (workers || []).forEach((w: any) => {
      const records = (monthAtt || []).filter((a: any) => a.worker_id === w.id);
      const present = records.filter((a: any) => a.status === "present").length;
      const half = records.filter((a: any) => a.status === "half_day").length;
      monthlySalary += (present + half * 0.5) * Number(w.daily_salary);
    });

    let totalCampaigns = 0;
    if (biz?.id) {
      const { count } = await supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("business_id", biz.id);
      totalCampaigns = count || 0;

      // Fetch business health data
      const [khataRes, inventoryRes, expenseRes] = await Promise.all([
        supabase.from("khata_entries").select("entry_type, amount").eq("business_id", biz.id),
        supabase.from("inventory_items").select("quantity, low_stock_threshold").eq("business_id", biz.id),
        supabase.from("expenses").select("entry_type, amount").eq("business_id", biz.id).gte("date", monthStart).lte("date", monthEnd),
      ]);

      const khataCredit = (khataRes.data || []).filter((k: any) => k.entry_type === "credit").reduce((s: number, k: any) => s + Number(k.amount), 0);
      const khataDebit = (khataRes.data || []).filter((k: any) => k.entry_type === "debit").reduce((s: number, k: any) => s + Number(k.amount), 0);
      const lowStockCount = (inventoryRes.data || []).filter((i: any) => Number(i.quantity) <= Number(i.low_stock_threshold)).length;
      const monthlyIncome = (expenseRes.data || []).filter((e: any) => e.entry_type === "income").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const monthlyExpense = (expenseRes.data || []).filter((e: any) => e.entry_type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);

      setHealth({ khataBalance: khataCredit - khataDebit, lowStockCount, monthlyIncome, monthlyExpense });
    }

    setStats({ totalWorkers, attendancePercent, monthlySalary, totalCampaigns });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const today = new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statCards = [
    {
      label: t("totalWorkers"),
      value: String(stats.totalWorkers),
      icon: Users,
      gradient: "from-primary/15 to-primary/5",
      iconBg: "gradient-primary",
      iconColor: "text-primary-foreground",
      trend: stats.totalWorkers > 0 ? `${stats.totalWorkers} active` : "—",
    },
    {
      label: t("todaysAttendance"),
      value: `${stats.attendancePercent}%`,
      icon: CalendarCheck,
      gradient: "from-emerald-500/15 to-emerald-500/5",
      iconBg: "bg-emerald-500",
      iconColor: "text-white",
      trend: stats.attendancePercent >= 80 ? "Great!" : stats.attendancePercent > 0 ? "Needs attention" : "—",
    },
    {
      label: t("thisMonthSalary"),
      value: `₹${stats.monthlySalary.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      gradient: "from-amber-500/15 to-amber-500/5",
      iconBg: "bg-amber-500",
      iconColor: "text-white",
      trend: lang === "hi" ? "इस माह" : "This month",
    },
    {
      label: t("totalCampaigns"),
      value: String(stats.totalCampaigns),
      icon: BarChart3,
      gradient: "from-violet-500/15 to-violet-500/5",
      iconBg: "bg-violet-500",
      iconColor: "text-white",
      trend: stats.totalCampaigns > 0 ? `${stats.totalCampaigns} sent` : "—",
    },
  ];

  const quickActions = [
    {
      to: "/attendance",
      icon: CalendarCheck,
      label: lang === "hi" ? "हाज़िरी लगाएं" : "Mark Attendance",
      desc: lang === "hi" ? "आज की हाज़िरी एक क्लिक में" : "One tap daily attendance",
      gradient: "bg-emerald-600",
    },
    {
      to: "/invoices",
      icon: FileText,
      label: lang === "hi" ? "बिल बनाएं" : "Create Invoice",
      desc: lang === "hi" ? "तुरंत बिल बनाएं" : "Generate invoice instantly",
      gradient: "gradient-primary",
    },
    {
      to: "/khata",
      icon: CreditCard,
      label: lang === "hi" ? "खाता एंट्री" : "Khata Entry",
      desc: lang === "hi" ? "उधार / जमा लिखें" : "Record credit / debit",
      gradient: "bg-amber-600",
    },
    {
      to: "/expenses",
      icon: Wallet,
      label: lang === "hi" ? "खर्चा लिखें" : "Add Expense",
      desc: lang === "hi" ? "आय / खर्च दर्ज करें" : "Track income & expenses",
      gradient: "bg-red-600",
    },
    {
      to: "/campaign",
      icon: Megaphone,
      label: t("aiCampaigns"),
      desc: lang === "hi" ? "AI से मार्केटिंग बनाएं" : "Create AI marketing",
      gradient: "bg-violet-600",
    },
    {
      to: "/workers",
      icon: Users,
      label: t("workers"),
      desc: lang === "hi" ? "टीम मैनेज करें" : "Manage your team",
      gradient: "bg-secondary",
    },
  ];

  if (needsOnboarding) {
    return <Onboarding onComplete={() => { setNeedsOnboarding(false); setLoading(true); load(); }} />;
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 md:space-y-8">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8">
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={18} className="text-primary-foreground/80" />
                  <span className="text-primary-foreground/80 text-sm font-medium">{getGreeting(lang)} 👋</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-primary-foreground font-display">
                  {shopName || t("welcome")}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={14} className="text-primary-foreground/60" />
                  <p className="text-primary-foreground/70 text-sm">{today}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((s) => (
                <Card key={s.label} className="group relative overflow-hidden border-border/40 hover:border-border transition-all duration-300 hover:shadow-md rounded-2xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-60`} />
                  <CardContent className="relative p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`rounded-xl ${s.iconBg} p-2.5 shadow-sm`}>
                        <s.icon size={20} className={s.iconColor} />
                      </div>
                      <TrendingUp size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-2xl md:text-3xl font-extrabold font-display text-foreground">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{s.trend}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Business Health Insights */}
            <BusinessInsights
              khataBalance={health.khataBalance}
              lowStockCount={health.lowStockCount}
              monthlyIncome={health.monthlyIncome}
              monthlyExpense={health.monthlyExpense}
              lang={lang}
            />

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-bold font-display text-foreground mb-4">
                {lang === "hi" ? "तुरंत कार्रवाई" : "Quick Actions"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action) => (
                  <Link key={action.to} to={action.to}>
                    <Card className="group border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 rounded-2xl cursor-pointer">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className={`shrink-0 rounded-xl ${action.gradient} p-3 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                          <action.icon size={20} className="text-primary-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm font-display text-foreground group-hover:text-primary transition-colors truncate">
                            {action.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{action.desc}</p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
