import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkerSalary {
  id: string;
  name: string;
  role: string | null;
  daily_salary: number;
  presentDays: number;
  halfDays: number;
  totalSalary: number;
}

export default function Salary() {
  const { user } = useAuth();
  const [data, setData] = useState<WorkerSalary[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: workers } = await supabase.from("workers").select("*").eq("user_id", user.id);
      const startDate = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
      const { data: att } = await supabase.from("attendance").select("worker_id, status").eq("user_id", user.id).gte("date", startDate).lte("date", endDate);

      const result = (workers || []).map((w: any) => {
        const records = (att || []).filter((a: any) => a.worker_id === w.id);
        const presentDays = records.filter((a: any) => a.status === "present").length;
        const halfDays = records.filter((a: any) => a.status === "half_day").length;
        const totalSalary = (presentDays + halfDays * 0.5) * Number(w.daily_salary);
        return { id: w.id, name: w.name, role: w.role, daily_salary: Number(w.daily_salary), presentDays, halfDays, totalSalary };
      });
      setData(result);
    };
    load();
  }, [user, month]);

  const grandTotal = data.reduce((s, w) => s + w.totalSalary, 0);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, i, 1);
    return { value: `2026-${String(i + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
  });

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">Salary</h1>
            <p className="text-muted-foreground">Monthly salary calculation</p>
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="mb-4 gradient-primary">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-primary-foreground/80">Total Payable</p>
              <p className="text-3xl font-bold font-display text-primary-foreground">₹{grandTotal.toLocaleString("en-IN")}</p>
            </div>
            <p className="text-sm text-primary-foreground/80">{data.length} workers</p>
          </CardContent>
        </Card>

        {data.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No workers to calculate salary for</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {data.map((w) => (
              <Card key={w.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold font-display">{w.name}</h3>
                      <p className="text-sm text-muted-foreground">{w.role || "Worker"}</p>
                    </div>
                    <p className="text-lg font-bold font-display text-primary">₹{w.totalSalary.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-accent p-2">
                      <p className="text-muted-foreground">Present</p>
                      <p className="font-semibold text-accent-foreground">{w.presentDays} days</p>
                    </div>
                    <div className="rounded-lg bg-accent p-2">
                      <p className="text-muted-foreground">Half Day</p>
                      <p className="font-semibold text-accent-foreground">{w.halfDays} days</p>
                    </div>
                    <div className="rounded-lg bg-accent p-2">
                      <p className="text-muted-foreground">Daily Rate</p>
                      <p className="font-semibold text-accent-foreground">₹{w.daily_salary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
