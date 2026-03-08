import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, CalendarCheck, IndianRupee } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [topWorkers, setTopWorkers] = useState<any[]>([]);
  const [expenseSummary, setExpenseSummary] = useState({ income: 0, expense: 0, profit: 0 });

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
    if (!biz) { setLoading(false); return; }

    // Revenue data (last 6 months from expenses)
    const months: any[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const monthEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const monthLabel = d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "short" });

      const { data: entries } = await supabase.from("expenses").select("amount, entry_type")
        .eq("business_id", biz.id).gte("date", monthStart).lte("date", monthEnd);

      const income = (entries || []).filter(e => e.entry_type === "income").reduce((s, e) => s + Number(e.amount), 0);
      const expense = (entries || []).filter(e => e.entry_type === "expense").reduce((s, e) => s + Number(e.amount), 0);
      months.push({ month: monthLabel, income, expense, profit: income - expense });
    }
    setRevenueData(months);

    // Current month expense summary
    const currentMonth = months[months.length - 1];
    setExpenseSummary({ income: currentMonth?.income || 0, expense: currentMonth?.expense || 0, profit: currentMonth?.profit || 0 });

    // Attendance patterns (last 7 days)
    const attData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short" });

      const { data: att } = await supabase.from("attendance").select("status").eq("user_id", user.id).eq("date", dateStr);
      const present = (att || []).filter(a => a.status === "present").length;
      const half = (att || []).filter(a => a.status === "half_day").length;
      const absent = (att || []).filter(a => a.status === "absent").length;
      attData.push({ day: dayLabel, present, half, absent });
    }
    setAttendanceData(attData);

    // Top workers (by attendance this month)
    const { data: workers } = await supabase.from("workers").select("id, name, daily_salary").eq("user_id", user.id);
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const { data: monthAtt } = await supabase.from("attendance").select("worker_id, status").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd);

    const workerStats = (workers || []).map(w => {
      const records = (monthAtt || []).filter(a => a.worker_id === w.id);
      const presentDays = records.filter(a => a.status === "present").length + records.filter(a => a.status === "half_day").length * 0.5;
      return { name: w.name, days: presentDays, salary: presentDays * Number(w.daily_salary) };
    }).sort((a, b) => b.days - a.days).slice(0, 5);
    setTopWorkers(workerStats);

    setLoading(false);
  };

  const chartConfig = {
    income: { label: t("income"), color: "hsl(var(--primary))" },
    expense: { label: t("expense"), color: "hsl(var(--destructive))" },
    profit: { label: t("profitLoss"), color: "#10b981" },
    present: { label: t("present"), color: "#10b981" },
    half: { label: t("halfDay"), color: "#f59e0b" },
    absent: { label: t("absent"), color: "hsl(var(--destructive))" },
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold font-display">{t("analyticsTitle")}</h1>
          <p className="text-muted-foreground text-sm">{t("analyticsSubtext")}</p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-xl bg-emerald-500 p-2"><TrendingUp size={18} className="text-white" /></div>
                    <span className="text-sm font-medium text-muted-foreground">{t("income")}</span>
                  </div>
                  <p className="text-2xl font-extrabold font-display">₹{expenseSummary.income.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-xl bg-destructive p-2"><IndianRupee size={18} className="text-white" /></div>
                    <span className="text-sm font-medium text-muted-foreground">{t("expense")}</span>
                  </div>
                  <p className="text-2xl font-extrabold font-display">₹{expenseSummary.expense.toLocaleString("en-IN")}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`rounded-xl p-2 ${expenseSummary.profit >= 0 ? "bg-emerald-500" : "bg-destructive"}`}>
                      <TrendingUp size={18} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{t("profitLoss")}</span>
                  </div>
                  <p className={`text-2xl font-extrabold font-display ${expenseSummary.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {expenseSummary.profit >= 0 ? "+" : ""}₹{expenseSummary.profit.toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Trends */}
            <Card className="rounded-2xl border-border/40">
              <CardHeader><CardTitle className="font-display">{t("revenueTrends")}</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={revenueData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Attendance Patterns */}
              <Card className="rounded-2xl border-border/40">
                <CardHeader><CardTitle className="font-display">{t("attendancePatterns")}</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={attendanceData}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="present" fill="var(--color-present)" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="half" fill="var(--color-half)" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="absent" fill="var(--color-absent)" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Top Workers */}
              <Card className="rounded-2xl border-border/40">
                <CardHeader><CardTitle className="font-display">{t("topWorkers")}</CardTitle></CardHeader>
                <CardContent>
                  {topWorkers.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">{t("noWorkersYet")}</p>
                  ) : (
                    <div className="space-y-3">
                      {topWorkers.map((w, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-primary-foreground text-xs font-bold">
                              #{i + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{w.name}</p>
                              <p className="text-xs text-muted-foreground">{w.days} {t("presentDays")}</p>
                            </div>
                          </div>
                          <p className="font-bold text-sm">₹{w.salary.toLocaleString("en-IN")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
