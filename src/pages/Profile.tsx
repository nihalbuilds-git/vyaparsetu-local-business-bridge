import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    category: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setExistingId(data.id);
        setForm({
          name: data.name || "",
          address: data.address || "",
          category: data.category || "",
        });
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    if (existingId) {
      await supabase.from("businesses").update(form).eq("id", existingId);
    } else {
      const { data } = await supabase.from("businesses").insert({ ...form, owner_id: user.id }).select("id").single();
      if (data) setExistingId(data.id);
    }
    toast({ title: "Business profile saved!" });
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-lg">
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">Business Profile</h1>
        <p className="text-muted-foreground mb-6">Your shop details</p>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div><Label>Shop Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Shop" /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Shop address" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
