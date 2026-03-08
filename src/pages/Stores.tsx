import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Store, Plus, Trash2, Edit2, MapPin } from "lucide-react";

const categories = ["Grocery", "Electronics", "Clothing", "General Store", "Hardware", "Medical", "Food & Restaurant", "Other"];

interface Business {
  id: string;
  name: string | null;
  address: string | null;
  category: string | null;
  created_at: string;
}

export default function Stores() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [stores, setStores] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Business | null>(null);
  const [form, setForm] = useState({ name: "", address: "", category: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadStores(); }, [user]);

  const loadStores = async () => {
    if (!user) return;
    const { data } = await supabase.from("businesses").select("*").eq("owner_id", user.id).order("created_at");
    setStores(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", address: "", category: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Business) => {
    setEditing(s);
    setForm({ name: s.name || "", address: s.address || "", category: s.category || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: t("error"), description: t("shopNameRequired"), variant: "destructive" }); return; }
    if (!user) return;
    setSaving(true);

    if (editing) {
      const { error } = await supabase.from("businesses").update({ name: form.name.trim(), address: form.address.trim() || null, category: form.category || null }).eq("id", editing.id);
      if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); }
      else { toast({ title: lang === "hi" ? "स्टोर अपडेट किया गया" : "Store updated" }); }
    } else {
      const { error } = await supabase.from("businesses").insert({ name: form.name.trim(), address: form.address.trim() || null, category: form.category || null, owner_id: user.id });
      if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); }
      else { toast({ title: lang === "hi" ? "नया स्टोर जोड़ा गया" : "New store added" }); }
    }

    setSaving(false);
    setDialogOpen(false);
    loadStores();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("businesses").delete().eq("id", id);
    toast({ title: lang === "hi" ? "स्टोर हटाया गया" : "Store removed" });
    loadStores();
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold font-display">{t("storesTitle")}</h1>
            <p className="text-muted-foreground text-sm">{t("storesSubtext")}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2" onClick={openAdd}>
                <Plus size={16} /> {lang === "hi" ? "स्टोर जोड़ें" : "Add Store"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">{editing ? (lang === "hi" ? "स्टोर संपादित करें" : "Edit Store") : (lang === "hi" ? "नया स्टोर जोड़ें" : "Add New Store")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("shopName")} *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t("shopNamePlaceholder")} /></div>
                <div><Label>{t("address")}</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder={t("addressPlaceholder")} /></div>
                <div>
                  <Label>{t("category")}</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder={t("selectCategoryPlaceholder")} /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                  {saving ? t("saving") : t("save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : stores.length === 0 ? (
          <Card className="rounded-2xl border-border/40">
            <CardContent className="py-16 text-center">
              <Store size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{lang === "hi" ? "अभी तक कोई स्टोर नहीं" : "No stores yet"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {stores.map(s => (
              <Card key={s.id} className="rounded-2xl border-border/40 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl gradient-primary p-2.5 mt-0.5"><Store size={20} className="text-primary-foreground" /></div>
                      <div>
                        <h3 className="font-bold font-display">{s.name}</h3>
                        {s.address && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={12} /> {s.address}</p>}
                        {s.category && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s.category}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit2 size={14} /></Button>
                      {stores.length > 1 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{lang === "hi" ? "स्टोर हटाएं?" : "Delete Store?"}</AlertDialogTitle>
                              <AlertDialogDescription>{lang === "hi" ? "इस स्टोर से जुड़ा सारा डेटा भी हट जाएगा।" : "All data linked to this store will also be deleted."}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-destructive-foreground">{t("delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
