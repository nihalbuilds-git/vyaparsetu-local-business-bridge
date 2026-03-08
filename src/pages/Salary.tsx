import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
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

  const shareOnWhatsApp = (worker: WorkerSalary) => {
    const text = `*${t("salarySlip")} - ${businessName}*\n${t("month")}: ${monthLabel}\n\n${t("worker")}: ${worker.name}\n${t("role")}: ${worker.role || t("worker")}\n${t("present")}: ${worker.presentDays} days\n${t("halfDays")}: ${worker.halfDays}\n${t("absent")}: ${worker.absentDays} days\n${t("dailyRate")}: Rs. ${worker.daily_salary}\n*${t("finalSalary")}: Rs. ${worker.totalSalary.toLocaleString("en-IN")}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">{t("salary")}</h1>
            <p className="text-muted-foreground">{t("monthlySalaryBreakdown")}</p>
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-4 space-y-3"><Skeleton className="h-5 w-28" /><Skeleton className="h-14 w-full rounded-lg" /></CardContent></Card>)}
          </div>
        ) : (
          <>
            <Card className="mb-4 gradient-primary">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-primary-foreground/80">{t("totalPayable")}</p>
                  <p className="text-3xl font-bold font-display text-primary-foreground">₹{grandTotal.toLocaleString("en-IN")}</p>
                </div>
                <p className="text-sm text-primary-foreground/80">{data.length} {t("workers_count")}</p>
              </CardContent>
            </Card>
            {data.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">{t("addWorkersForSalary")}</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {data.map((w) => (
                  <Card key={w.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div><h3 className="font-semibold font-display">{w.name}</h3><p className="text-sm text-muted-foreground">{w.role || t("worker")}</p></div>
                        <p className="text-lg font-bold font-display text-primary">₹{w.totalSalary.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                        <div className="rounded-lg bg-accent p-2"><p className="text-muted-foreground">{t("presentDays")}</p><p className="font-semibold text-accent-foreground">{w.presentDays} days</p></div>
                        <div className="rounded-lg bg-accent p-2"><p className="text-muted-foreground">{t("halfDays")}</p><p className="font-semibold text-accent-foreground">{w.halfDays} days</p></div>
                        <div className="rounded-lg bg-accent p-2"><p className="text-muted-foreground">{t("dailyRate")}</p><p className="font-semibold text-accent-foreground">₹{w.daily_salary}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => generatePDF(w)}><Download className="h-4 w-4 mr-1" /> {t("exportPdf")}</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => shareOnWhatsApp(w)}><Share2 className="h-4 w-4 mr-1" /> {t("whatsApp")}</Button>
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
