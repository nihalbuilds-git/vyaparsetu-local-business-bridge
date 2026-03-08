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
import { useToast } from "@/hooks/use-toast";
import { User, Store, MapPin, Tag, Mail, Shield } from "lucide-react";

const categories = ["Grocery", "Electronics", "Clothing", "General Store"];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "", category: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setExistingId(data.id);
        setForm({ name: data.name || "", address: data.address || "", category: data.category || "" });
      }
    });
  }, [user]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("shopNameRequired");
    if (!form.category) e.category = t("selectCategory");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    const payload = { name: form.name.trim(), address: form.address.trim(), category: form.category };
    if (existingId) {
      const { error } = await supabase.from("businesses").update(payload).eq("id", existingId);
      if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("businesses").insert({ ...payload, owner_id: user.id }).select("id").single();
      if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); setSaving(false); return; }
      if (data) setExistingId(data.id);
    }
    toast({ title: t("profileSaved") });
    setSaving(false);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/20 grid place-items-center text-primary-foreground font-extrabold font-display text-xl backdrop-blur-sm border border-white/10">
              {form.name ? getInitials(form.name) : <Store size={28} />}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold font-display text-primary-foreground">
                {form.name || t("businessProfile")}
              </h1>
              <p className="text-primary-foreground/70 text-sm mt-1">{t("enterShopDetails")}</p>
              {form.category && (
                <span className="inline-flex items-center gap-1 mt-2 bg-white/15 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground/90">
                  <Tag size={10} /> {form.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-accent px-5 py-3 border-b border-border/40 flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <h3 className="font-bold font-display text-sm text-foreground">
              {lang === "hi" ? "खाता जानकारी" : "Account Info"}
            </h3>
          </div>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent grid place-items-center shrink-0">
                <Mail size={18} className="text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{lang === "hi" ? "ईमेल" : "Email"}</p>
                <p className="text-sm font-medium text-foreground truncate">{user?.email || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details Form */}
        <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-accent px-5 py-3 border-b border-border/40 flex items-center gap-2">
            <Store size={16} className="text-primary" />
            <h3 className="font-bold font-display text-sm text-foreground">
              {lang === "hi" ? "व्यापार विवरण" : "Business Details"}
            </h3>
          </div>
          <CardContent className="p-5 space-y-5">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                {t("shopName")} *
              </Label>
              <div className="relative">
                <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("shopNamePlaceholder")}
                  className="pl-10 rounded-xl h-11"
                />
              </div>
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                {t("address")}
              </Label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder={t("addressPlaceholder")}
                  className="pl-10 rounded-xl h-11"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                {t("category")} *
              </Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder={t("selectCategoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
            </div>
            <Button
              onClick={save}
              disabled={saving}
              className="w-full gradient-primary text-primary-foreground rounded-xl h-12 font-bold text-base shadow-md hover:shadow-lg transition-all"
            >
              {saving ? t("saving") : t("save")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
