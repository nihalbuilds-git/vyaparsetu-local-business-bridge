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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Search, Trash2, Edit, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const unitOptions = ["pcs", "kg", "g", "L", "mL", "m", "cm", "ft", "box", "pack", "dozen", "pair", "set"];

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  low_stock_threshold: number;
}

export default function Inventory() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const emptyForm = { item_name: "", quantity: "", unit: "pcs", purchase_price: "", selling_price: "", low_stock_threshold: "5" };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
    if (!biz) { setLoading(false); return; }
    setBusinessId(biz.id);
    const { data } = await supabase.from("inventory_items").select("*").eq("business_id", biz.id).order("item_name");
    setItems((data as InventoryItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setForm({ item_name: item.item_name, quantity: String(item.quantity), unit: item.unit, purchase_price: String(item.purchase_price), selling_price: String(item.selling_price), low_stock_threshold: String(item.low_stock_threshold) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!businessId || !form.item_name.trim()) return;
    const payload = {
      business_id: businessId,
      item_name: form.item_name.trim(),
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit || "pcs",
      purchase_price: parseFloat(form.purchase_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      low_stock_threshold: parseFloat(form.low_stock_threshold) || 5,
    };
    let error;
    if (editItem) {
      ({ error } = await supabase.from("inventory_items").update(payload).eq("id", editItem.id));
    } else {
      ({ error } = await supabase.from("inventory_items").insert(payload));
    }
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: editItem ? t("inventoryUpdated") : t("inventoryAdded") });
    setForm(emptyForm);
    setEditItem(null);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("inventory_items").delete().eq("id", deleteId);
    setDeleteId(null);
    load();
  };

  const filtered = items.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()));
  const lowStockCount = items.filter(i => Number(i.quantity) <= Number(i.low_stock_threshold)).length;
  const totalValue = items.reduce((s, i) => s + Number(i.quantity) * Number(i.selling_price), 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-display text-foreground flex items-center gap-2">
              <Package className="text-primary" size={28} />
              {t("inventory")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("inventorySubtext")}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditItem(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2 rounded-xl"><Plus size={18} /> {t("addItem")}</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>{editItem ? t("editItem") : t("addItem")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("itemName")}</Label><Input value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder={t("itemNamePlaceholder")} className="rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("quantity")}</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" className="rounded-xl" /></div>
                  <div><Label>{t("unit")}</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pcs, kg, L" className="rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("purchasePrice")} (₹)</Label><Input type="number" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} placeholder="0" className="rounded-xl" /></div>
                  <div><Label>{t("sellingPrice")} (₹)</Label><Input type="number" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} placeholder="0" className="rounded-xl" /></div>
                </div>
                <div><Label>{t("lowStockAlert")}</Label><Input type="number" value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))} placeholder="5" className="rounded-xl" /></div>
                <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground rounded-xl">{t("save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl"><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">{t("totalItems")}</p><p className="text-lg font-bold text-foreground">{items.length}</p></CardContent></Card>
          <Card className="rounded-2xl border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">{t("lowStock")}</p><p className="text-lg font-bold text-amber-600">{lowStockCount}</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">{t("stockValue")}</p><p className="text-lg font-bold text-primary">₹{totalValue.toLocaleString("en-IN")}</p></CardContent></Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchItems")} className="pl-10 rounded-xl" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">{t("noInventoryItems")}</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const isLow = Number(item.quantity) <= Number(item.low_stock_threshold);
              return (
                <Card key={item.id} className={`rounded-2xl ${isLow ? "border-amber-300 dark:border-amber-700" : ""}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{item.item_name}</h3>
                        {isLow && <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-[10px]"><AlertTriangle size={10} />{t("lowStock")}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.quantity} {item.unit} · ₹{Number(item.purchase_price).toLocaleString("en-IN")} → ₹{Number(item.selling_price).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Edit size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>{t("delete")}?</AlertDialogTitle><AlertDialogDescription>{t("inventoryDeleteConfirm")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("cancel")}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
