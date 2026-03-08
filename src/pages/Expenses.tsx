import { useEffect, useState } from "react";
import { downloadCSV } from "@/lib/csv-export";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart3, TrendingUp, TrendingDown, Trash2, Wallet, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface Expense {
  id: string;
  entry_type: "income" | "expense";
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

const categories = {
  income: ["Sales", "Service", "Other Income"],
  expense: ["Rent", "Electricity", "Stock Purchase", "Transport", "Food", "Salary", "Other"],
};

export default function Expenses() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [entries, setEntries] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [form, setForm] = useState({ entry_type: "expense" as "income" | "expense", amount: "", category: "", description: "", date: format(new Date(), "yyyy-MM-dd") });

  const load = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
    if (!biz) { setLoading(false); return; }
    setBusinessId(biz.id);
    const monthStart = `${selectedMonth}-01`;
    const monthEnd = format(endOfMonth(new Date(`${selectedMonth}-01`)), "yyyy-MM-dd");
    const { data } = await supabase.from("expenses").select("*").eq("business_id", biz.id).gte("date", monthStart).lte("date", monthEnd).order("date", { ascending: false });
    setEntries((data as Expense[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, selectedMonth]);

  const handleSave = async () => {
    if (!businessId || !form.amount) return;
    const { error } = await supabase.from("expenses").insert({
      business_id: businessId,
      entry_type: form.entry_type,
      amount: parseFloat(form.amount),
      category: form.category || null,
      description: form.description.trim() || null,
      date: form.date,
    });
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: form.entry_type === "income" ? t("incomeAdded") : t("expenseAdded") });
    setForm({ entry_type: "expense", amount: "", category: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("expenses").delete().eq("id", deleteId);
    setDeleteId(null);
    load();
  };

  const totalIncome = entries.filter(e => e.entry_type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = entries.filter(e => e.entry_type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  const profit = totalIncome - totalExpense;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-display text-foreground flex items-center gap-2">
              <Wallet className="text-primary" size={28} /> {t("expenseTracker")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("expenseSubtext")}</p>
          </div>
          <div className="flex gap-2">
            <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="rounded-xl w-auto" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground gap-2 rounded-xl"><Plus size={18} /> {t("addEntry")}</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>{t("addEntry")}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant={form.entry_type === "income" ? "default" : "outline"} className={form.entry_type === "income" ? "gradient-primary text-primary-foreground flex-1" : "flex-1"} onClick={() => setForm(f => ({ ...f, entry_type: "income", category: "" }))}>
                      <TrendingUp size={16} className="mr-1" /> {t("income")}
                    </Button>
                    <Button variant={form.entry_type === "expense" ? "destructive" : "outline"} className="flex-1" onClick={() => setForm(f => ({ ...f, entry_type: "expense", category: "" }))}>
                      <TrendingDown size={16} className="mr-1" /> {t("expense")}
                    </Button>
                  </div>
                  <div><Label>{t("amount")} (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="rounded-xl" /></div>
                  <div>
                    <Label>{t("category")}</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("selectCategoryPlaceholder")} /></SelectTrigger>
                      <SelectContent>
                        {categories[form.entry_type].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t("description")}</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("expenseDescPlaceholder")} className="rounded-xl" /></div>
                  <div><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
                  <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground rounded-xl">{t("save")}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("income")}</p>
              <p className="text-lg font-bold text-green-600">₹{totalIncome.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("expense")}</p>
              <p className="text-lg font-bold text-red-600">₹{totalExpense.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className={`rounded-2xl ${profit >= 0 ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800" : "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"}`}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("profitLoss")}</p>
              <p className={`text-lg font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {profit >= 0 ? "+" : ""}₹{Math.abs(profit).toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : entries.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">{t("noExpenses")}</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <Card key={e.id} className="rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl grid place-items-center ${e.entry_type === "income" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {e.entry_type === "income" ? <TrendingUp size={18} className="text-green-600" /> : <TrendingDown size={18} className="text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{e.category || e.entry_type}</p>
                      {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(e.date), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${e.entry_type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {e.entry_type === "income" ? "+" : "-"}₹{Number(e.amount).toLocaleString("en-IN")}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(e.id)}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>{t("delete")}?</AlertDialogTitle><AlertDialogDescription>{t("expenseDeleteConfirm")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("cancel")}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
