import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, CheckCircle2, Trash2, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Worker { id: string; name: string; }
interface Advance {
  id: string;
  worker_id: string;
  amount: number;
  description: string | null;
  status: "pending" | "deducted";
  date: string;
}

export default function WorkerAdvances() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ worker_id: "", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });

  const load = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
    if (!biz) { setLoading(false); return; }
    setBusinessId(biz.id);
    const [{ data: wData }, { data: aData }] = await Promise.all([
      supabase.from("workers").select("id, name").eq("user_id", user.id),
      supabase.from("worker_advances").select("*").eq("business_id", biz.id).order("date", { ascending: false }),
    ]);
    setWorkers((wData as Worker[]) || []);
    setAdvances((aData as Advance[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!businessId || !form.worker_id || !form.amount) return;
    const { error } = await supabase.from("worker_advances").insert({
      business_id: businessId,
      worker_id: form.worker_id,
      amount: parseFloat(form.amount),
      description: form.description.trim() || null,
      date: form.date,
    });
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("advanceAdded") });
    setForm({ worker_id: "", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
    setDialogOpen(false);
    load();
  };

  const toggleStatus = async (adv: Advance) => {
    const newStatus = adv.status === "pending" ? "deducted" : "pending";
    await supabase.from("worker_advances").update({ status: newStatus }).eq("id", adv.id);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("worker_advances").delete().eq("id", deleteId);
    setDeleteId(null);
    load();
  };

  const getWorkerName = (id: string) => workers.find(w => w.id === id)?.name || "Unknown";
  const totalPending = advances.filter(a => a.status === "pending").reduce((s, a) => s + Number(a.amount), 0);
  const totalDeducted = advances.filter(a => a.status === "deducted").reduce((s, a) => s + Number(a.amount), 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-display text-foreground flex items-center gap-2">
              <Clock className="text-primary" size={28} /> {t("workerAdvances")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("advancesSubtext")}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2 rounded-xl"><Plus size={18} /> {t("addAdvance")}</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>{t("addAdvance")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t("worker")}</Label>
                  <Select value={form.worker_id} onValueChange={v => setForm(f => ({ ...f, worker_id: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("selectWorker")} /></SelectTrigger>
                    <SelectContent>
                      {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t("amount")} (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="rounded-xl" /></div>
                <div><Label>{t("description")}</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("advanceDescPlaceholder")} className="rounded-xl" /></div>
                <div><Label>{t("date")}</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
                <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground rounded-xl">{t("save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("pendingAdvances")}</p>
              <p className="text-lg font-bold text-amber-600">₹{totalPending.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("deductedAdvances")}</p>
              <p className="text-lg font-bold text-green-600">₹{totalDeducted.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : workers.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">{t("addWorkersFirst")}</CardContent></Card>
        ) : advances.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">{t("noAdvances")}</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {advances.map(adv => (
              <Card key={adv.id} className="rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl grid place-items-center ${adv.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
                      {adv.status === "pending" ? <Clock size={18} className="text-amber-600" /> : <CheckCircle2 size={18} className="text-green-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{getWorkerName(adv.worker_id)}</p>
                      {adv.description && <p className="text-xs text-muted-foreground">{adv.description}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(adv.date), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">₹{Number(adv.amount).toLocaleString("en-IN")}</span>
                    <Badge variant="outline" className={`text-[10px] cursor-pointer ${adv.status === "pending" ? "text-amber-600 border-amber-300" : "text-green-600 border-green-300"}`} onClick={() => toggleStatus(adv)}>
                      {adv.status === "pending" ? t("pending") : t("deducted")}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(adv.id)}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>{t("delete")}?</AlertDialogTitle><AlertDialogDescription>{t("advanceDeleteConfirm")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("cancel")}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
