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

const categories = ["Grocery", "Electronics", "Clothing", "General Store"];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
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

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-lg">
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">{t("businessProfile")}</h1>
        <p className="text-muted-foreground mb-6">{t("enterShopDetails")}</p>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label>{t("shopName")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("shopNamePlaceholder")} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label>{t("address")}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t("addressPlaceholder")} />
            </div>
            <div>
              <Label>{t("category")} *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder={t("selectCategoryPlaceholder")} /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
            </div>
            <Button onClick={save} disabled={saving} className="w-full gradient-primary text-primary-foreground">
              {saving ? t("saving") : t("save")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
