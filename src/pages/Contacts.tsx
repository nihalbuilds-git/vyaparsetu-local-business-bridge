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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, Phone, Mail, Tag, BookUser, Users } from "lucide-react";

const categories = ["Customer", "Supplier", "Relative", "Friend", "Other"];

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: string | null;
}

export default function Contacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", category: "Customer" });
  const [filterCategory, setFilterCategory] = useState("all");

  const fetchContacts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    setContacts((data as Contact[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const openAdd = () => {
    setEditContact(null);
    setForm({ name: "", phone: "", email: "", category: "Customer" });
    setDialogOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditContact(c);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", category: c.category || "Customer" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: t("nameRequired"), variant: "destructive" });
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      toast({ title: t("validPhone"), variant: "destructive" });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: t("invalidEmail"), variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim().slice(0, 100),
      phone: form.phone || null,
      email: form.email.trim().slice(0, 255) || null,
      category: form.category,
      user_id: user!.id,
    };

    if (editContact) {
      const { error } = await supabase.from("contacts").update(payload).eq("id", editContact.id);
      if (error) { toast({ title: t("error"), variant: "destructive" }); }
      else { toast({ title: t("contactUpdated") }); }
    } else {
      const { error } = await supabase.from("contacts").insert(payload);
      if (error) { toast({ title: t("error"), variant: "destructive" }); }
      else { toast({ title: t("contactAdded") }); }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchContacts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("contacts").delete().eq("id", deleteTarget.id);
    toast({ title: t("contactDeleted") });
    setDeleteTarget(null);
    fetchContacts();
  };

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.category && c.category.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = filterCategory === "all" || c.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const categoryCount = (cat: string) => contacts.filter(c => c.category === cat).length;
  const uniqueCategories = [...new Set(contacts.map(c => c.category).filter(Boolean))];

  const getInitial = (name: string) => name[0]?.toUpperCase() || "?";
  const getCategoryColor = (cat: string | null) => {
    switch (cat) {
      case "Customer": return "bg-primary/15 text-primary";
      case "Supplier": return "bg-emerald-500/15 text-emerald-600";
      case "Relative": return "bg-violet-500/15 text-violet-600";
      case "Friend": return "bg-amber-500/15 text-amber-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

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
                <BookUser size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold font-display text-primary-foreground">{t("contacts")}</h1>
                <p className="text-primary-foreground/70 text-sm mt-1">{t("manageContacts")}</p>
              </div>
            </div>
            <Button onClick={openAdd} className="bg-white/20 hover:bg-white/30 text-primary-foreground gap-2 rounded-xl font-bold backdrop-blur-sm border border-white/10">
              <Plus size={16} /> {t("addContact")}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        {!loading && contacts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="w-8 h-8 rounded-lg gradient-primary grid place-items-center mx-auto mb-1.5">
                  <Users size={16} className="text-primary-foreground" />
                </div>
                <p className="text-xl font-extrabold font-display">{contacts.length}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{lang === "hi" ? "कुल" : "Total"}</p>
              </CardContent>
            </Card>
            {uniqueCategories.slice(0, 3).map(cat => (
              <Card key={cat} className="rounded-2xl border-border/40">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className={`w-8 h-8 rounded-lg grid place-items-center mx-auto mb-1.5 ${getCategoryColor(cat!)}`}>
                    <Tag size={16} />
                  </div>
                  <p className="text-xl font-extrabold font-display">{categoryCount(cat!)}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">{cat}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchContacts")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl h-11 border-border/40"
            />
          </div>
          {uniqueCategories.length > 1 && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] rounded-xl h-11 border-border/40">
                <SelectValue placeholder={lang === "hi" ? "श्रेणी" : "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "hi" ? "सभी" : "All"}</SelectItem>
                {uniqueCategories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Contact List */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-accent grid place-items-center mb-4">
                <BookUser size={32} className="text-muted-foreground/50" />
              </div>
              <p className="font-medium">{search ? t("noContactsFound") : t("noContactsYet")}</p>
              {!search && <p className="text-sm mt-1">{lang === "hi" ? "ऊपर + बटन से जोड़ें" : "Click + above to add"}</p>}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <Card key={c.id} className="group rounded-2xl border-border/40 hover:border-primary/20 hover:shadow-md transition-all duration-200 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4 md:p-5">
                    {/* Avatar */}
                    <div className="shrink-0 w-11 h-11 rounded-xl gradient-primary grid place-items-center text-primary-foreground font-bold font-display text-sm">
                      {getInitial(c.name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold font-display text-foreground truncate">{c.name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                        {c.email && <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                      </div>
                    </div>
                    {/* Category Badge + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {c.category && (
                        <span className={`hidden sm:inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getCategoryColor(c.category)}`}>
                          {c.category}
                        </span>
                      )}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(c)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => setDeleteTarget(c)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editContact ? t("editContact") : t("addContact")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("name")} *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={100} placeholder={t("contactNamePlaceholder")} className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("phone")}</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder={t("phonePlaceholder10")} className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("email")}</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} maxLength={255} placeholder="email@example.com" className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("contactCategory")}</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground rounded-xl h-11 font-bold">
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteContact")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteContactDesc", { name: deleteTarget?.name || "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl">{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
