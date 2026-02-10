import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock } from "lucide-react";

type Status = "present" | "absent" | "half_day";

interface Worker {
  id: string;
  name: string;
  role: string | null;
}

interface AttendanceRecord {
  worker_id: string;
  status: Status;
}

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [date] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: w } = await supabase.from("workers").select("id, name, role").eq("user_id", user.id);
      setWorkers((w as Worker[]) || []);
      const { data: a } = await supabase.from("attendance").select("worker_id, status").eq("user_id", user.id).eq("date", date);
      const map: Record<string, Status> = {};
      (a as AttendanceRecord[] || []).forEach((r) => (map[r.worker_id] = r.status));
      setAttendance(map);
    };
    load();
  }, [user, date]);

  const toggle = (workerId: string) => {
    const order: Status[] = ["present", "absent", "half_day"];
    const current = attendance[workerId];
    const next = current ? order[(order.indexOf(current) + 1) % 3] : "present";
    setAttendance({ ...attendance, [workerId]: next });
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    for (const [worker_id, status] of Object.entries(attendance)) {
      const { data: existing } = await supabase.from("attendance").select("id").eq("worker_id", worker_id).eq("date", date).maybeSingle();
      if (existing) {
        await supabase.from("attendance").update({ status }).eq("id", existing.id);
      } else {
        await supabase.from("attendance").insert({ worker_id, status, date, user_id: user.id });
      }
    }
    toast({ title: "Attendance saved!" });
    setSaving(false);
  };

  const statusConfig: Record<Status, { icon: typeof Check; label: string; className: string }> = {
    present: { icon: Check, label: "Present", className: "bg-success text-success-foreground" },
    absent: { icon: X, label: "Absent", className: "bg-destructive text-destructive-foreground" },
    half_day: { icon: Clock, label: "Half Day", className: "bg-warning text-warning-foreground" },
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">Attendance</h1>
            <p className="text-muted-foreground">{new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const all: Record<string, Status> = {};
                workers.forEach((w) => (all[w.id] = "present"));
                setAttendance(all);
              }}
              disabled={workers.length === 0}
            >
              Mark All Present
            </Button>
            <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {workers.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Add workers first to mark attendance</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {workers.map((w) => {
              const status = attendance[w.id];
              const config = status ? statusConfig[status] : null;
              return (
                <Card key={w.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => toggle(w.id)}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-semibold font-display">{w.name}</h3>
                      <p className="text-sm text-muted-foreground">{w.role || "Worker"}</p>
                    </div>
                    {config ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
                        <config.icon size={12} /> {config.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Tap to mark</span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
