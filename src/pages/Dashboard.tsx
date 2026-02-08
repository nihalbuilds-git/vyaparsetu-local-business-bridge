import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, IndianRupee, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ workers: 0, presentToday: 0, totalSalary: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: workers } = await supabase.from("workers").select("id, daily_salary").eq("user_id", user.id);
      const today = new Date().toISOString().split("T")[0];
      const { data: attendance } = await supabase.from("attendance").select("id").eq("user_id", user.id).eq("date", today).eq("status", "present");
      const totalSalary = (workers || []).reduce((sum, w) => sum + Number(w.daily_salary), 0);
      setStats({
        workers: workers?.length || 0,
        presentToday: attendance?.length || 0,
        totalSalary: totalSalary * 30,
      });
    };
    load();
  }, [user]);

  const cards = [
    { title: "Total Workers", value: stats.workers, icon: Users, color: "text-primary" },
    { title: "Present Today", value: stats.presentToday, icon: CalendarCheck, color: "text-success" },
    { title: "Monthly Salary (est)", value: `₹${stats.totalSalary.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-warning" },
    { title: "Attendance Rate", value: stats.workers > 0 ? `${Math.round((stats.presentToday / stats.workers) * 100)}%` : "—", icon: TrendingUp, color: "text-accent-foreground" },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Welcome back! Here's your business overview.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ title, value, icon: Icon, color }) => (
            <Card key={title} className="border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={color} size={20} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-display">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
