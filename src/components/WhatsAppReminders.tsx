import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Users, CreditCard, CalendarCheck, Bell } from "lucide-react";
import { shareOnWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  halfDay: number;
  total: number;
  absentNames: string[];
}

interface KhataCustomer {
  name: string;
  phone: string | null;
  balance: number;
}

interface WhatsAppRemindersProps {
  lang: string;
  shopName: string;
  workers: Worker[];
  attendanceSummary: AttendanceSummary;
  khataCustomers: KhataCustomer[];
  monthlyExpense: number;
  monthlyIncome: number;
}

export default function WhatsAppReminders({
  lang, shopName, workers, attendanceSummary, khataCustomers, monthlyExpense, monthlyIncome,
}: WhatsAppRemindersProps) {
  const { toast } = useToast();
  const today = new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const sendAttendanceSummary = () => {
    const s = attendanceSummary;
    const absentList = s.absentNames.length > 0
      ? s.absentNames.map(n => `  ❌ ${n}`).join("\n")
      : lang === "hi" ? "  ✅ कोई अनुपस्थित नहीं" : "  ✅ No one absent";

    const msg = lang === "hi"
      ? `📋 *${shopName} — आज की हाज़िरी रिपोर्ट*\n📅 ${today}\n\n👷 कुल कर्मचारी: ${s.total}\n✅ उपस्थित: ${s.present}\n⏰ आधा दिन: ${s.halfDay}\n❌ अनुपस्थित: ${s.absent}\n\n📌 *अनुपस्थित कर्मचारी:*\n${absentList}\n\n— VyaparSetu से भेजा गया`
      : `📋 *${shopName} — Today's Attendance Report*\n📅 ${today}\n\n👷 Total Workers: ${s.total}\n✅ Present: ${s.present}\n⏰ Half Day: ${s.halfDay}\n❌ Absent: ${s.absent}\n\n📌 *Absent Workers:*\n${absentList}\n\n— Sent via VyaparSetu`;

    shareOnWhatsApp(msg);
    toast({ title: lang === "hi" ? "WhatsApp खुल रहा है..." : "Opening WhatsApp..." });
  };

  const sendPaymentReminder = (customer: KhataCustomer) => {
    const msg = lang === "hi"
      ? `🔔 *भुगतान रिमाइंडर — ${shopName}*\n\nनमस्ते ${customer.name} जी,\n\nआपका बकाया हिसाब: *₹${Math.abs(customer.balance).toLocaleString("en-IN")}*\n\n${customer.balance > 0 ? "कृपया जल्द से जल्द भुगतान करें।" : "आपका भुगतान अपडेटेड है।"}\n\nधन्यवाद! 🙏\n— ${shopName}`
      : `🔔 *Payment Reminder — ${shopName}*\n\nHi ${customer.name},\n\nYour outstanding balance: *₹${Math.abs(customer.balance).toLocaleString("en-IN")}*\n\n${customer.balance > 0 ? "Please make the payment at your earliest convenience." : "Your payment is up to date."}\n\nThank you! 🙏\n— ${shopName}`;

    shareOnWhatsApp(msg, customer.phone ? `91${customer.phone.replace(/[^0-9]/g, "")}` : undefined);
    toast({ title: lang === "hi" ? "WhatsApp खुल रहा है..." : "Opening WhatsApp..." });
  };

  const sendBulkPaymentReminders = () => {
    const pendingCustomers = khataCustomers.filter(c => c.balance > 0);
    if (pendingCustomers.length === 0) {
      toast({
        title: lang === "hi" ? "कोई बकाया नहीं" : "No pending dues",
        variant: "destructive",
      });
      return;
    }

    const list = pendingCustomers
      .map(c => `• ${c.name}: ₹${c.balance.toLocaleString("en-IN")}`)
      .join("\n");

    const msg = lang === "hi"
      ? `📊 *${shopName} — बकाया रिपोर्ट*\n📅 ${today}\n\n💰 *कुल बकाया ग्राहक: ${pendingCustomers.length}*\n\n${list}\n\n— VyaparSetu से भेजा गया`
      : `📊 *${shopName} — Pending Dues Report*\n📅 ${today}\n\n💰 *Total Pending Customers: ${pendingCustomers.length}*\n\n${list}\n\n— Sent via VyaparSetu`;

    shareOnWhatsApp(msg);
    toast({ title: lang === "hi" ? "WhatsApp खुल रहा है..." : "Opening WhatsApp..." });
  };

  const sendDailySummary = () => {
    const s = attendanceSummary;
    const pendingDues = khataCustomers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
    const profit = monthlyIncome - monthlyExpense;

    const msg = lang === "hi"
      ? `📊 *${shopName} — दैनिक सारांश*\n📅 ${today}\n\n👷 *हाज़िरी:* ${s.present}/${s.total} उपस्थित\n💰 *आज तक आय:* ₹${monthlyIncome.toLocaleString("en-IN")}\n💸 *आज तक खर्च:* ₹${monthlyExpense.toLocaleString("en-IN")}\n📈 *लाभ/हानि:* ₹${Math.abs(profit).toLocaleString("en-IN")} ${profit >= 0 ? "लाभ ✅" : "हानि ❌"}\n📌 *कुल बकाया:* ₹${pendingDues.toLocaleString("en-IN")}\n\n— VyaparSetu 🚀`
      : `📊 *${shopName} — Daily Summary*\n📅 ${today}\n\n👷 *Attendance:* ${s.present}/${s.total} present\n💰 *Income (MTD):* ₹${monthlyIncome.toLocaleString("en-IN")}\n💸 *Expense (MTD):* ₹${monthlyExpense.toLocaleString("en-IN")}\n📈 *P&L:* ₹${Math.abs(profit).toLocaleString("en-IN")} ${profit >= 0 ? "Profit ✅" : "Loss ❌"}\n📌 *Pending Dues:* ₹${pendingDues.toLocaleString("en-IN")}\n\n— VyaparSetu 🚀`;

    shareOnWhatsApp(msg);
    toast({ title: lang === "hi" ? "WhatsApp खुल रहा है..." : "Opening WhatsApp..." });
  };

  const pendingCustomers = khataCustomers.filter(c => c.balance > 0);

  return (
    <div className="space-y-4">
      {/* Quick Reminder Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={sendDailySummary}
          className="gap-2 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
        >
          <Share2 size={18} />
          {lang === "hi" ? "📊 दैनिक सारांश भेजें" : "📊 Send Daily Summary"}
        </Button>

        <Button
          onClick={sendAttendanceSummary}
          className="gap-2 rounded-xl h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md"
        >
          <CalendarCheck size={18} />
          {lang === "hi" ? "📋 हाज़िरी रिपोर्ट भेजें" : "📋 Send Attendance Report"}
        </Button>

        <Button
          onClick={sendBulkPaymentReminders}
          className="gap-2 rounded-xl h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
          disabled={pendingCustomers.length === 0}
        >
          <CreditCard size={18} />
          {lang === "hi" ? `💰 बकाया रिपोर्ट (${pendingCustomers.length})` : `💰 Dues Report (${pendingCustomers.length})`}
        </Button>

        <Button
          variant="outline"
          className="gap-2 rounded-xl h-12 font-bold border-primary/30"
          disabled
        >
          <Bell size={18} />
          {lang === "hi" ? "⏰ ऑटो रिमाइंडर (जल्द)" : "⏰ Auto Reminders (Coming Soon)"}
        </Button>
      </div>

      {/* Individual Payment Reminders */}
      {pendingCustomers.length > 0 && (
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard size={16} className="text-primary" />
              {lang === "hi" ? "बकाया ग्राहक — रिमाइंडर भेजें" : "Pending Customers — Send Reminder"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingCustomers.slice(0, 10).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-bold text-foreground">{c.name}</p>
                  <p className="text-xs text-destructive font-medium">
                    ₹{c.balance.toLocaleString("en-IN")} {lang === "hi" ? "बकाया" : "due"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-lg text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => sendPaymentReminder(c)}
                >
                  <Share2 size={12} /> WhatsApp
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
