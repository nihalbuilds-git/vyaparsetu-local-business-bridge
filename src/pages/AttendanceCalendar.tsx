import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

type Status = "present" | "absent" | "half_day";
interface Worker { id: string; name: string; }
interface AttendanceRow { worker_id: string; date: string; status: Status; }

const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

export default function AttendanceCalendar() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<string>("all");

  const dayLabels = lang === "hi" ? DAY_LABELS_HI : DAY_LABELS_EN;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const start = format(startOfMonth(month), "yyyy-MM-dd");
      const end = format(endOfMonth(month), "yyyy-MM-dd");
      const [{ data: w }, { data: a }] = await Promise.all([
        supabase.from("workers").select("id, name").eq("user_id", user.id),
        supabase.from("attendance").select("worker_id, date, status").eq("user_id", user.id).gte("date", start).lte("date", end),
      ]);
      setWorkers((w as Worker[]) || []);
      setAttendance((a as AttendanceRow[]) || []);
      setLoading(false);
    };
    load();
  }, [user, month]);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = getDay(startOfMonth(month));

  const getStatusForDay = (dateStr: string) => {
    const filtered = selectedWorker === "all"
      ? attendance.filter((a) => a.date === dateStr)
      : attendance.filter((a) => a.date === dateStr && a.worker_id === selectedWorker);
    return {
      present: filtered.filter((a) => a.status === "present").length,
      absent: filtered.filter((a) => a.status === "absent").length,
      halfDay: filtered.filter((a) => a.status === "half_day").length,
    };
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">{t("attendanceCalendar")}</h1>
            <p className="text-muted-foreground">{t("monthlyOverview")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft size={16} /></Button>
            <span className="font-semibold font-display min-w-[140px] text-center">
              {month.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))} disabled={startOfMonth(addMonths(month, 1)) > startOfMonth(new Date())}><ChevronRight size={16} /></Button>
          </div>
        </div>

        {!loading && workers.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button variant={selectedWorker === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedWorker("all")} className={selectedWorker === "all" ? "gradient-primary text-primary-foreground" : ""}>
              {t("allWorkers")}
            </Button>
            {workers.map((w) => (
              <Button key={w.id} variant={selectedWorker === w.id ? "default" : "outline"} size="sm" onClick={() => setSelectedWorker(w.id)} className={selectedWorker === w.id ? "gradient-primary text-primary-foreground" : ""}>
                {w.name}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <Card><CardContent className="p-4"><div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}</div></CardContent></Card>
        ) : workers.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground"><CalendarDays className="mx-auto mb-3 text-muted-foreground" size={40} />{t("addWorkersCalendar")}</CardContent></Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display">
                {selectedWorker === "all" ? t("allWorkers") : workers.find((w) => w.id === selectedWorker)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {dayLabels.map((d) => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="h-12 md:h-14" />)}
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isFuture = day > new Date();
                  const stats = getStatusForDay(dateStr);
                  const total = stats.present + stats.absent + stats.halfDay;
                  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                  return (
                    <div key={dateStr} className={`h-12 md:h-14 rounded-lg border flex flex-col items-center justify-center text-xs transition-colors ${isToday ? "border-primary ring-1 ring-primary/30" : "border-border"} ${isFuture ? "opacity-40" : ""}`}>
                      <span className={`text-[10px] md:text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{format(day, "d")}</span>
                      {!isFuture && total > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {stats.present > 0 && <span className="bg-success text-success-foreground rounded px-1 py-0.5 text-[9px] md:text-[10px] font-bold leading-none">{selectedWorker !== "all" ? "P" : stats.present}</span>}
                          {stats.halfDay > 0 && <span className="bg-warning text-warning-foreground rounded px-1 py-0.5 text-[9px] md:text-[10px] font-bold leading-none">{selectedWorker !== "all" ? "H" : stats.halfDay}</span>}
                          {stats.absent > 0 && <span className="bg-destructive text-destructive-foreground rounded px-1 py-0.5 text-[9px] md:text-[10px] font-bold leading-none">{selectedWorker !== "all" ? "A" : stats.absent}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-success" /> {t("present")}</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-warning" /> {t("halfDay")}</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive" /> {t("absent")}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
