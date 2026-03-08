import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Camera, Users, Phone, Briefcase, IndianRupee, Search } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
  daily_salary: number;
  joined_date: string;
  avatar_url: string | null;
}

export default function Workers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "", daily_salary: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
    if (biz) setBusinessId(biz.id);
    const { data } = await supabase.from("workers").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setWorkers((data as Worker[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("nameRequired");
    if (form.daily_salary && (isNaN(Number(form.daily_salary)) || Number(form.daily_salary) < 0)) e.daily_salary = t("validSalary");
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = t("validPhone");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadAvatar = async (workerId: string): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    const ext = avatarFile.name.split(".").pop();
    const path = `${user.id}/${workerId}.${ext}`;
    const { error } = await supabase.storage.from("worker-avatars").upload(path, avatarFile, { upsert: true });
    if (error) {
      toast({ title: t("uploadFailed"), description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("worker-avatars").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setUploading(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      role: form.role.trim() || null,
      daily_salary: Number(form.daily_salary) || 0,
      user_id: user.id,
    };
    if (businessId) payload.business_id = businessId;

    if (editId) {
      if (avatarFile) {
        const url = await uploadAvatar(editId);
        if (url) payload.avatar_url = url;
      }
      const { error } = await supabase.from("workers").update(payload as any).eq("id", editId);
      if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); setUploading(false); return; }
    } else {
      const { data, error } = await supabase.from("workers").insert(payload as any).select("id").single();
      if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); setUploading(false); return; }
      if (data && avatarFile) {
        const url = await uploadAvatar(data.id);
        if (url) {
          await supabase.from("workers").update({ avatar_url: url } as any).eq("id", data.id);
        }
      }
    }
    toast({ title: editId ? t("workerUpdated") : t("workerAdded") });
    resetForm();
    setUploading(false);
    load();
  };

  const resetForm = () => {
    setOpen(false);
    setEditId(null);
    setForm({ name: "", phone: "", role: "", daily_salary: "" });
    setErrors({});
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleEdit = (w: Worker) => {
    setEditId(w.id);
    setForm({ name: w.name, phone: w.phone || "", role: w.role || "", daily_salary: String(w.daily_salary) });
    setAvatarPreview(w.avatar_url || null);
    setAvatarFile(null);
    setErrors({});
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("workerRemoved") });
    load();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("fileTooLarge"), description: t("maxFileSize"), variant: "destructive" });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const filteredWorkers = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalSalary = workers.reduce((sum, w) => sum + Number(w.daily_salary), 0);

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
                <Users size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold font-display text-primary-foreground">{t("workers")}</h1>
                <p className="text-primary-foreground/70 text-sm mt-1">{t("manageTeam")}</p>
              </div>
            </div>
            <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 text-primary-foreground gap-2 rounded-xl font-bold backdrop-blur-sm border border-white/10">
                  <Plus size={16} /> {t("addWorker")}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle className="font-display">{editId ? t("editWorker") : t("addWorker")}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                      <Avatar className="h-20 w-20 border-2 border-border">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt="Worker photo" />
                        ) : (
                          <AvatarFallback className="bg-accent text-accent-foreground text-lg font-display">
                            {form.name ? getInitials(form.name) : <Camera size={24} />}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={20} className="text-background" />
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <p className="text-xs text-muted-foreground">{t("tapToUpload")}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("name")} *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("workerNamePlaceholder")} className="rounded-xl mt-1.5" />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("phone")}</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("phonePlaceholder10")} className="rounded-xl mt-1.5" />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("role")}</Label>
                    <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder={t("rolePlaceholder")} className="rounded-xl mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("dailySalaryRs")}</Label>
                    <Input type="number" value={form.daily_salary} onChange={(e) => setForm({ ...form, daily_salary: e.target.value })} placeholder="500" className="rounded-xl mt-1.5" />
                    {errors.daily_salary && <p className="text-xs text-destructive mt-1">{errors.daily_salary}</p>}
                  </div>
                  <Button onClick={handleSave} disabled={uploading} className="w-full gradient-primary text-primary-foreground rounded-xl h-11 font-bold">
                    {uploading ? t("saving") : t("save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Row */}
        {!loading && workers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl gradient-primary p-2.5 shrink-0"><Users size={18} className="text-primary-foreground" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{lang === "hi" ? "कुल कर्मचारी" : "Total"}</p>
                  <p className="text-xl font-extrabold font-display">{workers.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-amber-500 p-2.5 shrink-0"><IndianRupee size={18} className="text-white" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{lang === "hi" ? "कुल दैनिक" : "Daily Total"}</p>
                  <p className="text-xl font-extrabold font-display">₹{totalSalary.toLocaleString("en-IN")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/40 col-span-2 sm:col-span-1">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500 p-2.5 shrink-0"><Briefcase size={18} className="text-white" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{lang === "hi" ? "भूमिकाएं" : "Roles"}</p>
                  <p className="text-xl font-extrabold font-display">{new Set(workers.map(w => w.role).filter(Boolean)).size}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        {!loading && workers.length > 0 && (
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "hi" ? "नाम या भूमिका से खोजें..." : "Search by name or role..."}
              className="pl-10 rounded-xl h-11 border-border/40"
            />
          </div>
        )}

        {/* Workers Grid */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : workers.length === 0 ? (
          <Card className="border-dashed rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-accent grid place-items-center mb-4">
                <Users size={32} className="text-muted-foreground/50" />
              </div>
              <p className="font-medium">{t("noWorkersYet")}</p>
              <p className="text-sm mt-1">{lang === "hi" ? "ऊपर + बटन से जोड़ें" : "Click + above to add"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkers.map((w) => (
              <Card key={w.id} className="group rounded-2xl border-border/40 hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  {/* Card Top */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-border shadow-sm">
                          {w.avatar_url ? <AvatarImage src={w.avatar_url} alt={w.name} /> : (
                            <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold font-display">{getInitials(w.name)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-bold font-display text-foreground truncate">{w.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{w.role || t("noRole")}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(w)}>
                          <Edit2 size={14} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("removeWorker")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("removeWorkerDesc", { name: w.name })}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">{t("cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(w.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">{t("delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Details Row */}
                    {w.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Phone size={12} /> {w.phone}
                      </div>
                    )}
                  </div>

                  {/* Salary Footer */}
                  <div className="bg-gradient-to-r from-primary/5 to-accent border-t border-border/40 px-5 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{t("dailySalary")}</span>
                    <span className="font-extrabold font-display text-foreground">₹{Number(w.daily_salary).toLocaleString("en-IN")}</span>
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
