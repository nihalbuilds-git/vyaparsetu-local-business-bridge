import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from "date-fns";
import { TrendingUp, Users, CalendarCheck, Trophy, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Reports() {
  const { user } = useAuth();
  const { t } = useI18n();

  // Fetch business
  const { data: business } = useQuery({
    queryKey: ["business", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch 6 months of expenses (income + expense)
  const sixMonthsAgo = format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd");
  const { data: expenses = [] } = useQuery({
    queryKey: ["report-expenses", business?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("amount, entry_type, date, category")
        .eq("business_id", business!.id)
        .gte("date", sixMonthsAgo)
        .order("date");
      return data || [];
    },
    enabled: !!business?.id,
  });

  // Fetch 7 days of attendance
  const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
  const { data: attendance = [] } = useQuery({
    queryKey: ["report-attendance", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("status, date, worker_id")
        .eq("user_id", user!.id)
        .gte("date", sevenDaysAgo)
        .order("date");
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch workers
  const { data: workers = [] } = useQuery({
    queryKey: ["report-workers", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workers")
        .select("id, name, daily_salary, role")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch current month attendance for leaderboard
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const { data: monthAttendance = [] } = useQuery({
    queryKey: ["report-month-attendance", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("worker_id, status")
        .eq("user_id", user!.id)
        .gte("date", monthStart)
        .lte("date", monthEnd);
      return data || [];
    },
    enabled: !!user,
  });

  // --- P&L Chart Data (6 months) ---
  const plData = useMemo(() => {
    const months: { month: string; income: number; expense: number; profit: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM");
      const monthExpenses = expenses.filter(e => e.date?.startsWith(key));
      const income = monthExpenses.filter(e => e.entry_type === "income").reduce((s, e) => s + Number(e.amount), 0);
      const expense = monthExpenses.filter(e => e.entry_type === "expense").reduce((s, e) => s + Number(e.amount), 0);
      months.push({ month: label, income, expense, profit: income - expense });
    }
    return months;
  }, [expenses]);

  // --- Category breakdown (pie chart) ---
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.filter(e => e.entry_type === "expense").forEach(e => {
      const cat = e.category || "Other";
      cats[cat] = (cats[cat] || 0) + Number(e.amount);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const PIE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
    "hsl(230 35% 50%)",
    "hsl(280 50% 50%)",
    "hsl(180 50% 40%)",
  ];

  // --- Attendance trend (7 days) ---
  const attendanceTrend = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return days.map(d => {
      const key = format(d, "yyyy-MM-dd");
      const dayRecords = attendance.filter(a => a.date === key);
      return {
        day: format(d, "EEE"),
        present: dayRecords.filter(a => a.status === "present").length,
        absent: dayRecords.filter(a => a.status === "absent").length,
        half: dayRecords.filter(a => a.status === "half_day").length,
      };
    });
  }, [attendance]);

  // --- Top workers leaderboard ---
  const leaderboard = useMemo(() => {
    const workerStats: Record<string, { present: number; half: number; total: number }> = {};
    monthAttendance.forEach(a => {
      if (!workerStats[a.worker_id]) workerStats[a.worker_id] = { present: 0, half: 0, total: 0 };
      workerStats[a.worker_id].total++;
      if (a.status === "present") workerStats[a.worker_id].present++;
      if (a.status === "half_day") workerStats[a.worker_id].half++;
    });

    return workers
      .map(w => {
        const stats = workerStats[w.id] || { present: 0, half: 0, total: 0 };
        const score = stats.total > 0 ? ((stats.present + stats.half * 0.5) / stats.total) * 100 : 0;
        return { ...w, ...stats, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [workers, monthAttendance]);

  // Summary stats
  const currentMonth = plData[plData.length - 1];
  const prevMonth = plData[plData.length - 2];
  const profitChange = prevMonth && prevMonth.profit !== 0
    ? ((currentMonth.profit - prevMonth.profit) / Math.abs(prevMonth.profit)) * 100
    : 0;

  const totalPresent = attendanceTrend.reduce((s, d) => s + d.present, 0);
  const totalRecords = attendanceTrend.reduce((s, d) => s + d.present + d.absent + d.half, 0);
  const avgAttendance = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground flex items-center gap-2">
            <TrendingUp className="text-primary" size={28} />
            {t("analyticsTitle")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("analyticsSubtext")}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">This Month Income</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">₹{currentMonth.income.toLocaleString("en-IN")}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight size={14} className="text-success" />
                <span className="text-xs text-success font-medium">Income</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">This Month Expense</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">₹{currentMonth.expense.toLocaleString("en-IN")}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowDownRight size={14} className="text-destructive" />
                <span className="text-xs text-destructive font-medium">Expense</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
              <p className={`text-xl sm:text-2xl font-bold ${currentMonth.profit >= 0 ? "text-success" : "text-destructive"}`}>
                ₹{currentMonth.profit.toLocaleString("en-IN")}
              </p>
              {profitChange !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {profitChange > 0 ? <ArrowUpRight size={14} className="text-success" /> : <ArrowDownRight size={14} className="text-destructive" />}
                  <span className={`text-xs font-medium ${profitChange > 0 ? "text-success" : "text-destructive"}`}>
                    {Math.abs(profitChange).toFixed(0)}% vs last month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Attendance</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{avgAttendance}%</p>
              <div className="flex items-center gap-1 mt-1">
                <Users size={14} className="text-primary" />
                <span className="text-xs text-muted-foreground">{workers.length} workers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="revenue" className="gap-1.5"><TrendingUp size={14} /> P&L</TabsTrigger>
            <TabsTrigger value="attendance" className="gap-1.5"><CalendarCheck size={14} /> Attendance</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5"><Trophy size={14} /> Leaderboard</TabsTrigger>
          </TabsList>

          {/* P&L Chart */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display">{t("revenueTrends")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                      />
                      <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Pie Chart */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-display">Expense by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attendance Trend */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display">{t("attendancePatterns")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line type="monotone" dataKey="present" name="Present" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="absent" name="Absent" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="half" name="Half Day" stroke="hsl(var(--warning))" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Workers Leaderboard */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Trophy size={18} className="text-warning" />
                  {t("topWorkers")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No attendance data this month</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((w, idx) => (
                      <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full grid place-items-center font-bold text-sm shrink-0 ${
                          idx === 0 ? "gradient-primary text-primary-foreground" :
                          idx === 1 ? "bg-muted text-foreground" :
                          idx === 2 ? "bg-muted text-foreground" :
                          "bg-muted/50 text-muted-foreground"
                        }`}>
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </div>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold text-sm shrink-0">
                          {w.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{w.name}</p>
                          <p className="text-xs text-muted-foreground">{w.role || "Worker"} · ₹{w.daily_salary}/day</p>
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0">
                          <p className={`font-bold text-sm ${w.score >= 80 ? "text-success" : w.score >= 50 ? "text-warning" : "text-destructive"}`}>
                            {w.score.toFixed(0)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">{w.present}P / {w.total}D</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
