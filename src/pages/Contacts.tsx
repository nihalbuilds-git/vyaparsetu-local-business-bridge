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
import { Plus, Search, Pencil, Trash2, Phone, Mail, Tag } from "lucide-react";

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
  const { t } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", category: "Customer" });

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

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.category && c.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl md:text-3xl font-bold font-display">{t("contacts")} 📇</h1>
          <Button onClick={openAdd} className="gradient-primary text-primary-foreground gap-1" size="sm">
            <Plus size={16} /> {t("addContact")}
          </Button>
        </div>
        <p className="text-muted-foreground mb-4">{t("manageContacts")}</p>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchContacts")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            {search ? t("noContactsFound") : t("noContactsYet")}
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                      {c.category && <span className="flex items-center gap-1"><Tag size={10} /> {c.category}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(c)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editContact ? t("editContact") : t("addContact")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("name")} *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} maxLength={100} placeholder={t("contactNamePlaceholder")} /></div>
            <div><Label>{t("phone")}</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10)})} placeholder={t("phonePlaceholder10")} /></div>
            <div><Label>{t("email")}</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} maxLength={255} placeholder="email@example.com" /></div>
            <div>
              <Label>{t("contactCategory")}</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteContact")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteContactDesc", { name: deleteTarget?.name || "" })}</AlertDialogDescription>
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
