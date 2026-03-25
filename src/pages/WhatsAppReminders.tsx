import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Share2 } from "lucide-react";
import WhatsAppReminders from "@/components/WhatsAppReminders";
import { format } from "date-fns";

export default function WhatsAppRemindersPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("");
  const [workers, setWorkers] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0, absent: 0, halfDay: 0, total: 0, absentNames: [] as string[],
  });
  const [khataCustomers, setKhataCustomers] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: biz } = await supabase.from("businesses").select("id, name").eq("owner_id", user.id).maybeSingle();
      if (!biz) { setLoading(false); return; }
      setShopName(biz.name || "My Shop");

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const [workersRes, attRes, khataRes, expenseRes] = await Promise.all([
        supabase.from("workers").select("id, name, phone").eq("user_id", user.id),
        supabase.from("attendance").select("worker_id, status").eq("user_id", user.id).eq("date", todayStr),
        supabase.from("khata_entries").select("customer_name, customer_phone, entry_type, amount").eq("business_id", biz.id),
        supabase.from("expenses").select("entry_type, amount").eq("business_id", biz.id).gte("date", monthStart).lte("date", monthEnd),
      ]);

      const wList = workersRes.data || [];
      setWorkers(wList);

      const attMap = new Map<string, string>();
      (attRes.data || []).forEach((a: any) => attMap.set(a.worker_id, a.status));
      const present = [...attMap.values()].filter(s => s === "present").length;
      const halfDay = [...attMap.values()].filter(s => s === "half_day").length;
      const absent = wList.length - present - halfDay;
      const absentNames = wList.filter(w => !attMap.has(w.id) || attMap.get(w.id) === "absent").map(w => w.name);
      setAttendanceSummary({ present, absent, halfDay, total: wList.length, absentNames });

      // Group khata by customer
      const custMap = new Map<string, { name: string; phone: string | null; balance: number }>();
      (khataRes.data || []).forEach((e: any) => {
        const key = e.customer_name;
        if (!custMap.has(key)) custMap.set(key, { name: key, phone: e.customer_phone, balance: 0 });
        const c = custMap.get(key)!;
        if (e.entry_type === "credit") c.balance += Number(e.amount);
        else c.balance -= Number(e.amount);
      });
      setKhataCustomers(Array.from(custMap.values()));

      const income = (expenseRes.data || []).filter((e: any) => e.entry_type === "income").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const expense = (expenseRes.data || []).filter((e: any) => e.entry_type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      setMonthlyIncome(income);
      setMonthlyExpense(expense);

      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-emerald-600 p-6 md:p-8">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-start gap-3">
              <MessageSquare size={24} className="text-white mt-1" />
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold font-display text-white">
                  {lang === "hi" ? "WhatsApp रिमाइंडर" : "WhatsApp Reminders"}
                </h1>
                <p className="text-white/70 text-sm mt-1">
                  {lang === "hi" ? "हाज़िरी रिपोर्ट, भुगतान रिमाइंडर, और दैनिक सारांश WhatsApp पर भेजें" : "Send attendance reports, payment reminders & daily summaries on WhatsApp"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : (
          <WhatsAppReminders
            lang={lang}
            shopName={shopName}
            workers={workers}
            attendanceSummary={attendanceSummary}
            khataCustomers={khataCustomers}
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
          />
        )}
      </div>
    </AppLayout>
  );
}
