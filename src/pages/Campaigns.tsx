import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy } from "lucide-react";

const platforms = ["WhatsApp", "Instagram", "Facebook", "SMS", "Poster/Pamphlet"];
const languages = ["Hindi", "English", "Hinglish"];

export default function Campaigns() {
  const { toast } = useToast();
  const [form, setForm] = useState({ businessName: "", offer: "", platform: "WhatsApp", language: "Hinglish" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.businessName || !form.offer) {
      toast({ title: "Please fill business name and offer", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");

    try {
      const resp = await supabase.functions.invoke("generate-campaign", {
        body: { businessName: form.businessName, offer: form.offer, platform: form.platform, language: form.language },
      });
      if (resp.error) throw resp.error;
      setResult(resp.data?.campaign || "No campaign generated.");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">AI Campaigns</h1>
        <p className="text-muted-foreground mb-6">Generate marketing messages for your business</p>

        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div><Label>Business Name</Label><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="e.g. Sharma General Store" /></div>
            <div><Label>Offer / Promotion</Label><Textarea value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} placeholder="e.g. 20% off on all groceries this weekend" rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={generate} disabled={loading} className="w-full gradient-primary text-primary-foreground gap-2">
              <Sparkles size={16} />{loading ? "Generating..." : "Generate Campaign"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold font-display">Generated Campaign</h3>
                <Button variant="ghost" size="sm" onClick={copy} className="gap-1"><Copy size={14} /> Copy</Button>
              </div>
              <div className="rounded-lg bg-accent p-4 whitespace-pre-wrap text-sm">{result}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
