import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Share2, IndianRupee, Users, CalendarCheck, TrendingUp } from "lucide-react";
import { shareOnWhatsApp } from "@/lib/whatsapp";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface WorkerSalary {
  id: string; name: string; role: string | null; daily_salary: number;
  presentDays: number; halfDays: number; absentDays: number; totalDays: number; totalSalary: number;
}

export default function Salary() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [data, setData] = useState<WorkerSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: profile } = await supabase.from("profiles").select("business_name").eq("user_id", user.id).maybeSingle();
      setBusinessName(profile?.business_name || "My Business");
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
        const absentDays = records.filter((a: any) => a.status === "absent").length;
        const totalDays = lastDay;
        const totalSalary = (presentDays + halfDays * 0.5) * Number(w.daily_salary);
        return { id: w.id, name: w.name, role: w.role, daily_salary: Number(w.daily_salary), presentDays, halfDays, absentDays, totalDays, totalSalary };
      });
      setData(result);
      setLoading(false);
    };
    load();
  }, [user, month]);

  const grandTotal = data.reduce((s, w) => s + w.totalSalary, 0);
  const totalPresent = data.reduce((s, w) => s + w.presentDays, 0);
  const totalHalf = data.reduce((s, w) => s + w.halfDays, 0);

  const currentYear = new Date().getFullYear();
  const months: { value: string; label: string }[] = [];
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    for (let i = 0; i < 12; i++) {
      const d = new Date(y, i, 1);
      months.push({ value: `${y}-${String(i + 1).padStart(2, "0")}`, label: d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" }) });
    }
  }
  const monthLabel = months.find((m) => m.value === month)?.label || month;

  const generatePDF = (worker: WorkerSalary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text(businessName, pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12); doc.setFont("helvetica", "normal");
    doc.text(t("salarySlip"), pageWidth / 2, 28, { align: "center" });
    doc.setDrawColor(200); doc.line(15, 32, pageWidth - 15, 32);
    doc.setFontSize(11); doc.text(`${t("month")}: ${monthLabel}`, 15, 42);
    const startY = 52;
    const rows = [
      [t("workerName"), worker.name], [t("role"), worker.role || t("worker")],
      [t("totalDaysInMonth"), String(worker.totalDays)], [t("presentDays"), String(worker.presentDays)],
      [t("halfDays"), String(worker.halfDays)], [t("absentDays"), String(worker.absentDays)],
      [t("dailySalaryBase"), `Rs. ${worker.daily_salary.toLocaleString("en-IN")}`],
      [t("finalSalary"), `Rs. ${worker.totalSalary.toLocaleString("en-IN")}`],
    ];
    rows.forEach((row, i) => {
      const y = startY + i * 10;
      doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255);
      doc.rect(15, y - 5, pageWidth - 30, 10, "F");
      doc.setFont("helvetica", "bold"); doc.text(row[0], 20, y);
      doc.setFont("helvetica", "normal"); doc.text(row[1], pageWidth - 20, y, { align: "right" });
    });
    const footerY = startY + rows.length * 10 + 15;
    doc.setDrawColor(200); doc.line(15, footerY, pageWidth - 15, footerY);
    doc.setFontSize(9); doc.setTextColor(130);
    doc.text(`${t("generatedOn")} ${new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")}`, pageWidth / 2, footerY + 8, { align: "center" });
    doc.save(`Salary_Slip_${worker.name.replace(/\s+/g, "_")}_${month}.pdf`);
    toast({ title: t("pdfDownloaded"), description: t("salarySlipDownloaded", { name: worker.name }) });
  };

  const shareWorkerOnWhatsApp = (worker: WorkerSalary) => {
    const text = `*${t("salarySlip")} - ${businessName}*\n${t("month")}: ${monthLabel}\n\n${t("worker")}: ${worker.name}\n${t("role")}: ${worker.role || t("worker")}\n${t("present")}: ${worker.presentDays} days\n${t("halfDays")}: ${worker.halfDays}\n${t("absent")}: ${worker.absentDays} days\n${t("dailyRate")}: Rs. ${worker.daily_salary}\n*${t("finalSalary")}: Rs. ${worker.totalSalary.toLocaleString("en-IN")}*`;
    shareOnWhatsApp(text);
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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
                <IndianRupee size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold font-display text-primary-foreground">{t("salary")}</h1>
                <p className="text-primary-foreground/70 text-sm mt-1">{t("monthlySalaryBreakdown")}</p>
              </div>
            </div>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[170px] bg-white/15 border-white/10 text-primary-foreground rounded-xl backdrop-blur-sm font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="w-8 h-8 rounded-lg gradient-primary grid place-items-center mx-auto mb-1.5">
                    <IndianRupee size={16} className="text-primary-foreground" />
                  </div>
                  <p className="text-lg md:text-xl font-extrabold font-display">₹{grandTotal.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("totalPayable")}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 grid place-items-center mx-auto mb-1.5">
                    <CalendarCheck size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-lg md:text-xl font-extrabold font-display">{totalPresent}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("presentDays")}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 grid place-items-center mx-auto mb-1.5">
                    <Users size={16} className="text-violet-600" />
                  </div>
                  <p className="text-lg md:text-xl font-extrabold font-display">{data.length}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{t("workers_count")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Worker Salary Cards */}
            {data.length === 0 ? (
              <Card className="border-dashed rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-accent grid place-items-center mb-4">
                    <IndianRupee size={32} className="text-muted-foreground/50" />
                  </div>
                  <p className="font-medium">{t("addWorkersForSalary")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {data.map((w) => (
                  <Card key={w.id} className="group rounded-2xl border-border/40 hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Worker Header */}
                      <div className="p-5 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-11 h-11 rounded-xl gradient-primary grid place-items-center text-primary-foreground font-bold font-display text-sm">
                              {getInitials(w.name)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold font-display text-foreground truncate">{w.name}</h3>
                              <p className="text-xs text-muted-foreground">{w.role || t("worker")}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl md:text-2xl font-extrabold font-display text-primary">₹{w.totalSalary.toLocaleString("en-IN")}</p>
                            <p className="text-[10px] text-muted-foreground">{t("finalSalary")}</p>
                          </div>
                        </div>

                        {/* Attendance Breakdown */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-xl bg-success/10 border border-success/20 p-2.5">
                            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{t("presentDays")}</p>
                            <p className="font-extrabold font-display text-foreground text-sm">{w.presentDays}</p>
                          </div>
                          <div className="rounded-xl bg-warning/10 border border-warning/20 p-2.5">
                            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{t("halfDays")}</p>
                            <p className="font-extrabold font-display text-foreground text-sm">{w.halfDays}</p>
                          </div>
                          <div className="rounded-xl bg-accent border border-border/40 p-2.5">
                            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{t("dailyRate")}</p>
                            <p className="font-extrabold font-display text-foreground text-sm">₹{w.daily_salary}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="bg-gradient-to-r from-primary/5 to-accent border-t border-border/40 px-5 py-3 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 font-medium h-9" onClick={() => generatePDF(w)}>
                          <Download size={14} /> {t("exportPdf")}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl gap-1.5 font-medium h-9" onClick={() => shareWorkerOnWhatsApp(w)}>
                          <Share2 size={14} /> {t("whatsApp")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
