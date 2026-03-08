import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "half_day";

interface Worker { id: string; name: string; role: string | null; }
interface AttendanceRecord { worker_id: string; status: Status; }

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const date = format(selectedDate, "yyyy-MM-dd");
  const isToday = date === format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: w } = await supabase.from("workers").select("id, name, role").eq("user_id", user.id);
      setWorkers((w as Worker[]) || []);
      const { data: a } = await supabase.from("attendance").select("worker_id, status").eq("user_id", user.id).eq("date", date);
      const map: Record<string, Status> = {};
      (a as AttendanceRecord[] || []).forEach((r) => (map[r.worker_id] = r.status));
      setAttendance(map);
      setLoading(false);
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
    toast({ title: t("attendanceSaved") });
    setSaving(false);
  };

  const statusConfig: Record<Status, { icon: typeof Check; label: string; className: string }> = {
    present: { icon: Check, label: t("present"), className: "bg-success text-success-foreground" },
    absent: { icon: X, label: t("absent"), className: "bg-destructive text-destructive-foreground" },
    half_day: { icon: Clock, label: t("halfDay"), className: "bg-warning text-warning-foreground" },
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">{t("attendance")}</h1>
            <p className="text-muted-foreground">
              {selectedDate.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {isToday && ` — ${t("today")}`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/attendance-calendar"><CalendarIcon size={16} /> {t("calendarView")}</Link>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("gap-2", !isToday && "border-primary text-primary")}>
                  <CalendarIcon size={16} />
                  {isToday ? t("today") : format(selectedDate, "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} disabled={(d) => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={() => { const all: Record<string, Status> = {}; workers.forEach((w) => (all[w.id] = "present")); setAttendance(all); }} disabled={workers.length === 0}>
              {t("markAllPresent")}
            </Button>
            <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="flex items-center justify-between p-4"><div className="space-y-2"><Skeleton className="h-5 w-28" /><Skeleton className="h-4 w-20" /></div><Skeleton className="h-7 w-20 rounded-full" /></CardContent></Card>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">{t("addWorkersFirst")}</CardContent></Card>
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
                      <p className="text-sm text-muted-foreground">{w.role || t("worker")}</p>
                    </div>
                    {config ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
                        <config.icon size={12} /> {config.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("tapToSet")}</span>
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
