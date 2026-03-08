import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CalendarDays, Check, X, Clock } from "lucide-react";

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

  // Monthly stats
  const totalPresent = attendance.filter(a => selectedWorker === "all" || a.worker_id === selectedWorker).filter(a => a.status === "present").length;
  const totalAbsent = attendance.filter(a => selectedWorker === "all" || a.worker_id === selectedWorker).filter(a => a.status === "absent").length;
  const totalHalf = attendance.filter(a => selectedWorker === "all" || a.worker_id === selectedWorker).filter(a => a.status === "half_day").length;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/20 grid place-items-center">
                <CalendarDays size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold font-display text-primary-foreground">{t("attendanceCalendar")}</h1>
                <p className="text-primary-foreground/70 text-sm mt-1">{t("monthlyOverview")}</p>
              </div>
            </div>
            {/* Month Navigation */}
            <div className="flex items-center gap-2 bg-white/15 rounded-xl p-1 backdrop-blur-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-lg" onClick={() => setMonth(subMonths(month, 1))}>
                <ChevronLeft size={16} />
              </Button>
              <span className="font-bold font-display text-primary-foreground text-sm min-w-[120px] text-center">
                {month.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" })}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 rounded-lg" onClick={() => setMonth(addMonths(month, 1))} disabled={startOfMonth(addMonths(month, 1)) > startOfMonth(new Date())}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Monthly Summary Stats */}
        {!loading && workers.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-success/15 grid place-items-center mx-auto mb-1.5">
                  <Check size={16} className="text-success" />
                </div>
                <p className="text-xl font-extrabold font-display">{totalPresent}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("present")}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-destructive/15 grid place-items-center mx-auto mb-1.5">
                  <X size={16} className="text-destructive" />
                </div>
                <p className="text-xl font-extrabold font-display">{totalAbsent}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("absent")}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-warning/15 grid place-items-center mx-auto mb-1.5">
                  <Clock size={16} className="text-warning" />
                </div>
                <p className="text-xl font-extrabold font-display">{totalHalf}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("halfDay")}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Worker Filter Pills */}
        {!loading && workers.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedWorker === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedWorker("all")}
              className={`rounded-full ${selectedWorker === "all" ? "gradient-primary text-primary-foreground" : ""}`}
            >
              {t("allWorkers")}
            </Button>
            {workers.map((w) => (
              <Button
                key={w.id}
                variant={selectedWorker === w.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedWorker(w.id)}
                className={`rounded-full ${selectedWorker === w.id ? "gradient-primary text-primary-foreground" : ""}`}
              >
                {w.name}
              </Button>
            ))}
          </div>
        )}

        {/* Calendar Grid */}
        {loading ? (
          <Card className="rounded-2xl"><CardContent className="p-4"><div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div></CardContent></Card>
        ) : workers.length === 0 ? (
          <Card className="border-dashed rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-accent grid place-items-center mb-4">
                <CalendarDays size={32} className="text-muted-foreground/50" />
              </div>
              <p className="font-medium">{t("addWorkersCalendar")}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-border/40 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-primary/5 to-accent px-5 py-3 border-b border-border/40">
              <h3 className="font-bold font-display text-sm text-foreground">
                {selectedWorker === "all" ? t("allWorkers") : workers.find((w) => w.id === selectedWorker)?.name}
              </h3>
            </div>
            <CardContent className="p-3 md:p-5">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {dayLabels.map((d) => (
                  <div key={d} className="text-center text-[10px] md:text-xs font-bold text-muted-foreground py-1.5 uppercase tracking-wide">{d}</div>
                ))}
              </div>
              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="h-12 md:h-16" />)}
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isFuture = day > new Date();
                  const stats = getStatusForDay(dateStr);
                  const total = stats.present + stats.absent + stats.halfDay;
                  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

                  // Determine dominant status for background
                  let bgClass = "";
                  if (!isFuture && total > 0 && selectedWorker !== "all") {
                    if (stats.present > 0) bgClass = "bg-success/10 border-success/30";
                    else if (stats.halfDay > 0) bgClass = "bg-warning/10 border-warning/30";
                    else if (stats.absent > 0) bgClass = "bg-destructive/10 border-destructive/30";
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`h-12 md:h-16 rounded-xl border flex flex-col items-center justify-center text-xs transition-all ${
                        isToday ? "border-primary ring-2 ring-primary/20 shadow-sm" : bgClass || "border-border/50"
                      } ${isFuture ? "opacity-30" : "hover:shadow-sm"}`}
                    >
                      <span className={`text-[10px] md:text-xs ${isToday ? "font-extrabold text-primary" : "text-muted-foreground font-medium"}`}>
                        {format(day, "d")}
                      </span>
                      {!isFuture && total > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {stats.present > 0 && <span className="bg-success text-success-foreground rounded-md px-1 py-0.5 text-[8px] md:text-[10px] font-bold leading-none">{selectedWorker !== "all" ? "P" : stats.present}</span>}
                          {stats.halfDay > 0 && <span className="bg-warning text-warning-foreground rounded-md px-1 py-0.5 text-[8px] md:text-[10px] font-bold leading-none">{selectedWorker !== "all" ? "H" : stats.halfDay}</span>}
                          {stats.absent > 0 && <span className="bg-destructive text-destructive-foreground rounded-md px-1 py-0.5 text-[8px] md:text-[10px] font-bold leading-none">{selectedWorker !== "all" ? "A" : stats.absent}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-5 mt-5 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-success" /> {t("present")}</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-warning" /> {t("halfDay")}</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-destructive" /> {t("absent")}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
