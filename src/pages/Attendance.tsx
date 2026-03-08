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
import { Check, X, Clock, CalendarIcon, CalendarDays, CheckCircle2, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const statusConfig: Record<Status, { icon: typeof Check; label: string; className: string; dotClass: string }> = {
    present: { icon: Check, label: t("present"), className: "bg-success text-success-foreground", dotClass: "bg-success" },
    absent: { icon: X, label: t("absent"), className: "bg-destructive text-destructive-foreground", dotClass: "bg-destructive" },
    half_day: { icon: Clock, label: t("halfDay"), className: "bg-warning text-warning-foreground", dotClass: "bg-warning" },
  };

  const presentCount = Object.values(attendance).filter(s => s === "present").length;
  const absentCount = Object.values(attendance).filter(s => s === "absent").length;
  const halfCount = Object.values(attendance).filter(s => s === "half_day").length;
  const markedCount = Object.keys(attendance).length;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-white/20 grid place-items-center">
                  <CalendarDays size={24} className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold font-display text-primary-foreground">{t("attendance")}</h1>
                  <p className="text-primary-foreground/70 text-sm mt-1">
                    {selectedDate.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    {isToday && ` — ${t("today")}`}
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/10 gap-2 rounded-xl font-bold backdrop-blur-sm">
                <Link to="/attendance-calendar"><CalendarIcon size={16} /> {t("calendarView")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats + Actions */}
        {!loading && workers.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-success/15 grid place-items-center mx-auto mb-1.5">
                  <Check size={16} className="text-success" />
                </div>
                <p className="text-xl font-extrabold font-display">{presentCount}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("present")}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-destructive/15 grid place-items-center mx-auto mb-1.5">
                  <X size={16} className="text-destructive" />
                </div>
                <p className="text-xl font-extrabold font-display">{absentCount}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("absent")}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-warning/15 grid place-items-center mx-auto mb-1.5">
                  <Clock size={16} className="text-warning" />
                </div>
                <p className="text-xl font-extrabold font-display">{halfCount}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("halfDay")}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        {workers.length > 5 && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={lang === "hi" ? "वर्कर खोजें..." : "Search workers..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex gap-2 flex-wrap items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("gap-2 rounded-xl", !isToday && "border-primary text-primary")}>
                <CalendarIcon size={16} />
                {isToday ? t("today") : format(selectedDate, "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} disabled={(d) => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => { const all: Record<string, Status> = {}; workers.forEach((w) => (all[w.id] = "present")); setAttendance(all); }}
            disabled={workers.length === 0}
          >
            <CheckCircle2 size={16} /> {t("markAllPresent")}
          </Button>
          <div className="flex-1" />
          <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground rounded-xl h-10 px-6 font-bold shadow-md">
            {saving ? t("saving") : t("save")}
            {markedCount > 0 && <span className="ml-1.5 bg-white/20 rounded-full px-2 py-0.5 text-xs">{markedCount}/{workers.length}</span>}
          </Button>
        </div>

        {/* Worker List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : workers.length === 0 ? (
          <Card className="border-dashed rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-accent grid place-items-center mb-4">
                <Users size={32} className="text-muted-foreground/50" />
              </div>
              <p className="font-medium">{t("addWorkersFirst")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {workers.map((w) => {
              const status = attendance[w.id];
              const config = status ? statusConfig[status] : null;
              return (
                <Card
                  key={w.id}
                  className={cn(
                    "rounded-2xl border-border/40 transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.99]",
                    status === "present" && "border-success/30 bg-success/5",
                    status === "absent" && "border-destructive/30 bg-destructive/5",
                    status === "half_day" && "border-warning/30 bg-warning/5",
                  )}
                  onClick={() => toggle(w.id)}
                >
                  <CardContent className="flex items-center justify-between p-4 md:p-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl grid place-items-center text-sm font-bold font-display shrink-0",
                        config ? config.className : "bg-accent text-accent-foreground"
                      )}>
                        {config ? <config.icon size={18} /> : w.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold font-display text-foreground">{w.name}</h3>
                        <p className="text-xs text-muted-foreground">{w.role || t("worker")}</p>
                      </div>
                    </div>
                    {config ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${config.className}`}>
                        <config.icon size={12} /> {config.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-accent rounded-full px-3 py-1.5 font-medium">{t("tapToSet")}</span>
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
