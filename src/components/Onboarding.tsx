import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, Users, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const categories = ["Grocery", "Electronics", "Clothing", "General Store"];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [bizForm, setBizForm] = useState({ name: "", address: "", category: "" });
  const [bizErrors, setBizErrors] = useState<Record<string, string>>({});

  const [workerForm, setWorkerForm] = useState({ name: "", phone: "", role: "", daily_salary: "" });
  const [workerErrors, setWorkerErrors] = useState<Record<string, string>>({});

  const validateBiz = () => {
    const e: Record<string, string> = {};
    if (!bizForm.name.trim()) e.name = "Shop name is required";
    if (!bizForm.category) e.category = "Please select a category";
    setBizErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateWorker = () => {
    const e: Record<string, string> = {};
    if (!workerForm.name.trim()) e.name = "Worker name is required";
    if (workerForm.daily_salary && (isNaN(Number(workerForm.daily_salary)) || Number(workerForm.daily_salary) < 0)) e.daily_salary = "Enter a valid salary";
    if (workerForm.phone && !/^\d{10}$/.test(workerForm.phone.replace(/\s/g, ""))) e.phone = "Enter a 10-digit phone number";
    setWorkerErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveBusiness = async () => {
    if (!validateBiz() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").insert({
      name: bizForm.name.trim(),
      address: bizForm.address.trim(),
      category: bizForm.category,
      owner_id: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    setSaving(false);
    setStep(1);
  };

  const saveWorker = async () => {
    if (!validateWorker() || !user) return;
    setSaving(true);
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
    const { error } = await supabase.from("workers").insert({
      name: workerForm.name.trim(),
      phone: workerForm.phone.trim() || null,
      role: workerForm.role.trim() || null,
      daily_salary: Number(workerForm.daily_salary) || 0,
      user_id: user.id,
      business_id: biz?.id || null,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    setSaving(false);
    setStep(2);
  };

  const steps = [
    { icon: Store, label: "Business Profile" },
    { icon: Users, label: "First Worker" },
    { icon: CheckCircle2, label: "All Set!" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                i <= step ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <s.icon size={16} />
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 rounded transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Business Profile */}
        {step === 0 && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold font-display">Welcome to VyaparSetu! 🎉</h2>
                <p className="text-muted-foreground text-sm mt-1">Let's set up your business first</p>
              </div>
              <div>
                <Label>Shop Name *</Label>
                <Input value={bizForm.name} onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} placeholder="My Shop" />
                {bizErrors.name && <p className="text-xs text-destructive mt-1">{bizErrors.name}</p>}
              </div>
              <div>
                <Label>Address</Label>
                <Input value={bizForm.address} onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })} placeholder="Shop location" />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={bizForm.category} onValueChange={(v) => setBizForm({ ...bizForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {bizErrors.category && <p className="text-xs text-destructive mt-1">{bizErrors.category}</p>}
              </div>
              <Button onClick={saveBusiness} disabled={saving} className="w-full gradient-primary text-primary-foreground gap-2">
                {saving ? "Saving..." : <>Continue <ArrowRight size={16} /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Add First Worker */}
        {step === 1 && (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold font-display">Add Your First Worker 👷</h2>
                <p className="text-muted-foreground text-sm mt-1">You can always add more later</p>
              </div>
              <div>
                <Label>Worker Name *</Label>
                <Input value={workerForm.name} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} placeholder="Worker's name" />
                {workerErrors.name && <p className="text-xs text-destructive mt-1">{workerErrors.name}</p>}
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={workerForm.phone} onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })} placeholder="10 digit number" />
                {workerErrors.phone && <p className="text-xs text-destructive mt-1">{workerErrors.phone}</p>}
              </div>
              <div>
                <Label>Role</Label>
                <Input value={workerForm.role} onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })} placeholder="e.g. Helper, Driver" />
              </div>
              <div>
                <Label>Daily Salary (₹)</Label>
                <Input type="number" value={workerForm.daily_salary} onChange={(e) => setWorkerForm({ ...workerForm, daily_salary: e.target.value })} placeholder="500" />
                {workerErrors.daily_salary && <p className="text-xs text-destructive mt-1">{workerErrors.daily_salary}</p>}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                  <ArrowLeft size={16} /> Back
                </Button>
                <Button onClick={saveWorker} disabled={saving} className="flex-1 gradient-primary text-primary-foreground gap-2">
                  {saving ? "Saving..." : <>Continue <ArrowRight size={16} /></>}
                </Button>
              </div>
              <Button variant="link" onClick={() => setStep(2)} className="w-full text-muted-foreground">
                Skip for now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Done */}
        {step === 2 && (
          <Card className="animate-fade-in">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2 className="text-xl font-bold font-display">You're All Set! 🚀</h2>
              <p className="text-muted-foreground text-sm">
                Your business is ready. Head to the dashboard to start managing your team.
              </p>
              <Button onClick={onComplete} className="w-full gradient-primary text-primary-foreground gap-2">
                Go to Dashboard <ArrowRight size={16} />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
