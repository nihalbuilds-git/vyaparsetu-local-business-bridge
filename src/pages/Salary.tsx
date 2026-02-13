import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface WorkerSalary {
  id: string;
  name: string;
  role: string | null;
  daily_salary: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  totalDays: number;
  totalSalary: number;
}

export default function Salary() {
  const { user } = useAuth();
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
  const months = [];
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    for (let i = 0; i < 12; i++) {
      const d = new Date(y, i, 1);
      months.push({ value: `${y}-${String(i + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) });
    }
  }

  const monthLabel = months.find((m) => m.value === month)?.label || month;

  const generatePDF = (worker: WorkerSalary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(businessName, pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Salary Slip", pageWidth / 2, 28, { align: "center" });
    doc.setDrawColor(200);
    doc.line(15, 32, pageWidth - 15, 32);

    // Month
    doc.setFontSize(11);
    doc.text(`Month: ${monthLabel}`, 15, 42);

    // Worker details table
    const startY = 52;
    const rows = [
      ["Worker Name", worker.name],
      ["Role", worker.role || "Worker"],
      ["Total Days in Month", String(worker.totalDays)],
      ["Present Days", String(worker.presentDays)],
      ["Half Days", String(worker.halfDays)],
      ["Absent Days", String(worker.absentDays)],
      ["Daily Salary (Base)", `Rs. ${worker.daily_salary.toLocaleString("en-IN")}`],
      ["Final Salary", `Rs. ${worker.totalSalary.toLocaleString("en-IN")}`],
    ];

    rows.forEach((row, i) => {
      const y = startY + i * 10;
      doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255);
      doc.rect(15, y - 5, pageWidth - 30, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.text(row[0], 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(row[1], pageWidth - 20, y, { align: "right" });
    });

    // Footer
    const footerY = startY + rows.length * 10 + 15;
    doc.setDrawColor(200);
    doc.line(15, footerY, pageWidth - 15, footerY);
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, footerY + 8, { align: "center" });

    doc.save(`Salary_Slip_${worker.name.replace(/\s+/g, "_")}_${month}.pdf`);
    toast({ title: "PDF Downloaded", description: `Salary slip for ${worker.name} has been downloaded.` });
  };

  const shareOnWhatsApp = (worker: WorkerSalary) => {
    const text = `*Salary Slip - ${businessName}*\nMonth: ${monthLabel}\n\nWorker: ${worker.name}\nRole: ${worker.role || "Worker"}\nPresent: ${worker.presentDays} days\nHalf Days: ${worker.halfDays}\nAbsent: ${worker.absentDays} days\nDaily Rate: Rs. ${worker.daily_salary}\n*Final Salary: Rs. ${worker.totalSalary.toLocaleString("en-IN")}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">Salary</h1>
            <p className="text-muted-foreground">Monthly salary breakdown</p>
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
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
              <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Add workers to calculate salaries</CardContent></Card>
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
                      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
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
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => generatePDF(w)}>
                          <Download className="h-4 w-4 mr-1" /> Export PDF
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => shareOnWhatsApp(w)}>
                          <Share2 className="h-4 w-4 mr-1" /> WhatsApp
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
