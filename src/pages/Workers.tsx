import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
import { Plus, Trash2, Edit2, Camera } from "lucide-react";

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
    if (!form.name.trim()) e.name = "Name is required";
    if (form.daily_salary && (isNaN(Number(form.daily_salary)) || Number(form.daily_salary) < 0)) e.daily_salary = "Enter a valid salary";
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Enter a 10-digit phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadAvatar = async (workerId: string): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    const ext = avatarFile.name.split(".").pop();
    const path = `${user.id}/${workerId}.${ext}`;
    const { error } = await supabase.storage.from("worker-avatars").upload(path, avatarFile, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
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
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setUploading(false); return; }
    } else {
      const { data, error } = await supabase.from("workers").insert(payload as any).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setUploading(false); return; }
      if (data && avatarFile) {
        const url = await uploadAvatar(data.id);
        if (url) {
          await supabase.from("workers").update({ avatar_url: url } as any).eq("id", data.id);
        }
      }
    }
    toast({ title: editId ? "Worker updated" : "Worker added" });
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
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Worker removed" });
    load();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed", variant: "destructive" });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">Workers</h1>
            <p className="text-muted-foreground">Manage your team</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2"><Plus size={16} /> Add Worker</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "Add"} Worker</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {/* Avatar upload */}
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
                  <p className="text-xs text-muted-foreground">Tap to upload photo</p>
                </div>

                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Worker's name" />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10 digit number" />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
                <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Helper, Driver" /></div>
                <div>
                  <Label>Daily Salary (₹)</Label>
                  <Input type="number" value={form.daily_salary} onChange={(e) => setForm({ ...form, daily_salary: e.target.value })} placeholder="500" />
                  {errors.daily_salary && <p className="text-xs text-destructive mt-1">{errors.daily_salary}</p>}
                </div>
                <Button onClick={handleSave} disabled={uploading} className="w-full gradient-primary text-primary-foreground">
                  {uploading ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><UsersIcon size={40} className="mb-3 opacity-40" /><p>No workers added yet</p></CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((w) => (
              <Card key={w.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        {w.avatar_url ? (
                          <AvatarImage src={w.avatar_url} alt={w.name} />
                        ) : (
                          <AvatarFallback className="bg-accent text-accent-foreground text-xs font-display">
                            {getInitials(w.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="font-semibold font-display">{w.name}</h3>
                        <p className="text-sm text-muted-foreground">{w.role || "No role"}</p>
                        {w.phone && <p className="text-sm text-muted-foreground">{w.phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(w)}><Edit2 size={14} /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 size={14} /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Worker?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{w.name}"? This will also remove their attendance records. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(w.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-accent px-3 py-2">
                    <span className="text-xs text-muted-foreground">Daily Salary</span>
                    <span className="font-semibold text-accent-foreground">₹{Number(w.daily_salary).toLocaleString("en-IN")}</span>
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

function UsersIcon({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
