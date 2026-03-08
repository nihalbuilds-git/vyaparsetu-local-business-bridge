import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, CreditCard, TrendingUp, TrendingDown, Trash2, Phone, Search, IndianRupee, Share2 } from "lucide-react";
import { format } from "date-fns";
import { shareOnWhatsApp } from "@/lib/whatsapp";

interface KhataEntry {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  amount: number;
  entry_type: "credit" | "debit";
  description: string | null;
  date: string;
  created_at: string;
}

export default function Khata() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", amount: "", entry_type: "credit" as "credit" | "debit", description: "", date: format(new Date(), "yyyy-MM-dd") });

  const load = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
    if (!biz) { setLoading(false); return; }
    setBusinessId(biz.id);
    const { data } = await supabase.from("khata_entries").select("*").eq("business_id", biz.id).order("date", { ascending: false });
    setEntries((data as KhataEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!businessId || !form.customer_name.trim() || !form.amount) return;
    const { error } = await supabase.from("khata_entries").insert({
      business_id: businessId,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      amount: parseFloat(form.amount),
      entry_type: form.entry_type,
      description: form.description.trim() || null,
      date: form.date,
    });
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: form.entry_type === "credit" ? t("khataCredit") : t("khataDebit"), description: `₹${form.amount} - ${form.customer_name}` });
    setForm({ customer_name: "", customer_phone: "", amount: "", entry_type: "credit", description: "", date: format(new Date(), "yyyy-MM-dd") });
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("khata_entries").delete().eq("id", deleteId);
    setDeleteId(null);
    load();
  };

  const filtered = entries.filter(e => e.customer_name.toLowerCase().includes(search.toLowerCase()));
  const totalCredit = entries.filter(e => e.entry_type === "credit").reduce((s, e) => s + Number(e.amount), 0);
  const totalDebit = entries.filter(e => e.entry_type === "debit").reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalCredit - totalDebit;

  // Group by customer
  const customerMap = new Map<string, { credit: number; debit: number; entries: KhataEntry[] }>();
  filtered.forEach(e => {
    const key = e.customer_name;
    if (!customerMap.has(key)) customerMap.set(key, { credit: 0, debit: 0, entries: [] });
    const c = customerMap.get(key)!;
    if (e.entry_type === "credit") c.credit += Number(e.amount);
    else c.debit += Number(e.amount);
    c.entries.push(e);
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-display text-foreground flex items-center gap-2">
              <CreditCard className="text-primary" size={28} />
              {t("khataBook")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("khataSubtext")}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2 rounded-xl">
                <Plus size={18} /> {t("addEntry")}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>{t("addEntry")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={form.entry_type === "credit" ? "default" : "outline"} className={form.entry_type === "credit" ? "gradient-primary text-primary-foreground flex-1" : "flex-1"} onClick={() => setForm(f => ({ ...f, entry_type: "credit" }))}>
                    <TrendingUp size={16} className="mr-1" /> {t("khataCredit")}
                  </Button>
                  <Button variant={form.entry_type === "debit" ? "destructive" : "outline"} className="flex-1" onClick={() => setForm(f => ({ ...f, entry_type: "debit" }))}>
                    <TrendingDown size={16} className="mr-1" /> {t("khataDebit")}
                  </Button>
                </div>
                <div><Label>{t("name")}</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder={t("contactNamePlaceholder")} className="rounded-xl" /></div>
                <div><Label>{t("phone")}</Label><Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder={t("phonePlaceholder10")} className="rounded-xl" /></div>
                <div><Label>{t("amount")} (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="rounded-xl" /></div>
                <div><Label>{t("description")}</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("khataDescPlaceholder")} className="rounded-xl" /></div>
                <div><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
                <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground rounded-xl">{t("save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("khataCredit")}</p>
              <p className="text-lg font-bold text-green-600">₹{totalCredit.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("khataDebit")}</p>
              <p className="text-lg font-bold text-red-600">₹{totalDebit.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("khataBalance")}</p>
              <p className={`text-lg font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>₹{Math.abs(balance).toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchContacts")} className="pl-10 rounded-xl" />
        </div>

        {/* Customer-wise entries */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : customerMap.size === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">{t("noKhataEntries")}</CardContent></Card>
        ) : (
          Array.from(customerMap.entries()).map(([name, data]) => (
            <Card key={name} className="rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{name}</CardTitle>
                  <span className={`text-sm font-bold ${data.credit - data.debit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{Math.abs(data.credit - data.debit).toLocaleString("en-IN")} {data.credit - data.debit >= 0 ? t("khataCredit") : t("khataDebit")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.entries.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${e.entry_type === "credit" ? "bg-green-500" : "bg-red-500"}`} />
                      <div>
                        <p className="text-sm font-medium">{e.description || (e.entry_type === "credit" ? t("khataCredit") : t("khataDebit"))}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(e.date), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${e.entry_type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {e.entry_type === "credit" ? "+" : "-"}₹{Number(e.amount).toLocaleString("en-IN")}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(e.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}?</AlertDialogTitle>
            <AlertDialogDescription>{t("khataDeleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
