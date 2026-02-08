import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const businessTypes = ["Kirana Store", "Restaurant", "Salon", "Workshop", "Clinic", "Tailoring", "Electronics", "Other"];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    phone: "",
    address: "",
    business_type: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({
        business_name: data.business_name || "",
        owner_name: data.owner_name || "",
        phone: data.phone || "",
        address: data.address || "",
        business_type: data.business_type || "",
      });
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { data: existing } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (existing) {
      await supabase.from("profiles").update(form).eq("user_id", user.id);
    } else {
      await supabase.from("profiles").insert({ ...form, user_id: user.id });
    }
    toast({ title: "Profile saved!" });
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-lg">
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">Business Profile</h1>
        <p className="text-muted-foreground mb-6">Your business details</p>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div><Label>Business Name</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="My Shop" /></div>
            <div><Label>Owner Name</Label><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Your name" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Shop address" /></div>
            <div>
              <Label>Business Type</Label>
              <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {businessTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} disabled={saving} className="w-full gradient-primary text-primary-foreground">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
