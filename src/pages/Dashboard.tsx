import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import Onboarding from "@/components/Onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Users, History, CalendarCheck, IndianRupee, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  totalWorkers: number;
  attendancePercent: number;
  monthlySalary: number;
  totalCampaigns: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalWorkers: 0, attendancePercent: 0, monthlySalary: 0, totalCampaigns: 0 });

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
    { label: t("totalWorkers"), value: String(stats.totalWorkers), icon: Users, color: "text-primary" },
    { label: t("todaysAttendance"), value: `${stats.attendancePercent}%`, icon: CalendarCheck, color: "text-emerald-500" },
    { label: t("thisMonthSalary"), value: `₹${stats.monthlySalary.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-amber-500" },
    { label: t("totalCampaigns"), value: String(stats.totalCampaigns), icon: BarChart3, color: "text-violet-500" },
  ];

  if (needsOnboarding) {
    return <Onboarding onComplete={() => { setNeedsOnboarding(false); setLoading(true); load(); }} />;
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">
              {shopName || t("welcome")}
            </h1>
            <p className="text-muted-foreground mb-6">{today}</p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {statCards.map((s) => (
                <Card key={s.label} className="border-border/50">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`rounded-lg bg-accent p-3 ${s.color}`}>
                      <s.icon size={22} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold font-display">{s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
              <Link to="/campaign">
                <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
                    <Megaphone className="text-primary" size={36} />
                    <span className="text-lg font-bold font-display group-hover:text-primary transition-colors">{t("aiCampaigns")}</span>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/workers">
                <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
                    <Users className="text-primary" size={36} />
                    <span className="text-lg font-bold font-display group-hover:text-primary transition-colors">{t("workers")}</span>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/campaign-history">
                <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
                    <History className="text-primary" size={36} />
                    <span className="text-lg font-bold font-display group-hover:text-primary transition-colors">{t("campaignHistory")}</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
