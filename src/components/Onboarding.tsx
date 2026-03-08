import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, Users, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const categories = ["Grocery", "Electronics", "Clothing", "General Store"];

interface OnboardingProps { onComplete: () => void; }

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [bizForm, setBizForm] = useState({ name: "", address: "", category: "" });
  const [bizErrors, setBizErrors] = useState<Record<string, string>>({});
  const [workerForm, setWorkerForm] = useState({ name: "", phone: "", role: "", daily_salary: "" });
  const [workerErrors, setWorkerErrors] = useState<Record<string, string>>({});

  const validateBiz = () => {
    const e: Record<string, string> = {};
    if (!bizForm.name.trim()) e.name = t("shopNameRequired");
    if (!bizForm.category) e.category = t("selectCategory");
    setBizErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateWorker = () => {
    const e: Record<string, string> = {};
    if (!workerForm.name.trim()) e.name = t("workerNameRequired");
    if (workerForm.daily_salary && (isNaN(Number(workerForm.daily_salary)) || Number(workerForm.daily_salary) < 0)) e.daily_salary = t("validSalary");
    if (workerForm.phone && !/^\d{10}$/.test(workerForm.phone.replace(/\s/g, ""))) e.phone = t("validPhone");
    setWorkerErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveBusiness = async () => {
    if (!validateBiz() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").insert({ name: bizForm.name.trim(), address: bizForm.address.trim(), category: bizForm.category, owner_id: user.id });
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); setSaving(false); return; }
    setSaving(false);
    setStep(1);
  };

  const saveWorker = async () => {
    if (!validateWorker() || !user) return;
    setSaving(true);
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
    const { error } = await supabase.from("workers").insert({
      name: workerForm.name.trim(), phone: workerForm.phone.trim() || null, role: workerForm.role.trim() || null,
      daily_salary: Number(workerForm.daily_salary) || 0, user_id: user.id, business_id: biz?.id || null,
    } as any);
    if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); setSaving(false); return; }
    setSaving(false);
    setStep(2);
  };

  const steps = [
    { icon: Store, label: t("businessProfileStep") },
    { icon: Users, label: t("firstWorkerStep") },
    { icon: CheckCircle2, label: t("allSetStep") },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${i <= step ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <s.icon size={16} />
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 rounded transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold font-display">{t("welcomeVyaparSetu")}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t("letsSetup")}</p>
              </div>
              <div><Label>{t("shopName")} *</Label><Input value={bizForm.name} onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} placeholder={t("shopNamePlaceholder")} />{bizErrors.name && <p className="text-xs text-destructive mt-1">{bizErrors.name}</p>}</div>
              <div><Label>{t("address")}</Label><Input value={bizForm.address} onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })} placeholder={t("addressPlaceholder")} /></div>
              <div>
                <Label>{t("category")} *</Label>
                <Select value={bizForm.category} onValueChange={(v) => setBizForm({ ...bizForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder={t("selectCategoryPlaceholder")} /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {bizErrors.category && <p className="text-xs text-destructive mt-1">{bizErrors.category}</p>}
              </div>
              <Button onClick={saveBusiness} disabled={saving} className="w-full gradient-primary text-primary-foreground gap-2">
                {saving ? t("saving") : <>{t("continue")} <ArrowRight size={16} /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold font-display">{t("addFirstWorker")}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t("addMoreLater")}</p>
              </div>
              <div><Label>{t("name")} *</Label><Input value={workerForm.name} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} placeholder={t("workerNamePlaceholder")} />{workerErrors.name && <p className="text-xs text-destructive mt-1">{workerErrors.name}</p>}</div>
              <div><Label>{t("phone")}</Label><Input value={workerForm.phone} onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })} placeholder={t("phonePlaceholder10")} />{workerErrors.phone && <p className="text-xs text-destructive mt-1">{workerErrors.phone}</p>}</div>
              <div><Label>{t("role")}</Label><Input value={workerForm.role} onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })} placeholder={t("rolePlaceholder")} /></div>
              <div><Label>{t("dailySalaryRs")}</Label><Input type="number" value={workerForm.daily_salary} onChange={(e) => setWorkerForm({ ...workerForm, daily_salary: e.target.value })} placeholder="500" />{workerErrors.daily_salary && <p className="text-xs text-destructive mt-1">{workerErrors.daily_salary}</p>}</div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="gap-2"><ArrowLeft size={16} /> {t("back")}</Button>
                <Button onClick={saveWorker} disabled={saving} className="flex-1 gradient-primary text-primary-foreground gap-2">
                  {saving ? t("saving") : <>{t("continue")} <ArrowRight size={16} /></>}
                </Button>
              </div>
              <Button variant="link" onClick={() => setStep(2)} className="w-full text-muted-foreground">{t("skipForNow")}</Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-fade-in">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2 className="text-xl font-bold font-display">{t("youreAllSet")}</h2>
              <p className="text-muted-foreground text-sm">{t("businessReady")}</p>
              <Button onClick={onComplete} className="w-full gradient-primary text-primary-foreground gap-2">
                {t("goToDashboard")} <ArrowRight size={16} />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
