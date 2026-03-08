import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy } from "lucide-react";

const campaignTypes = ["New Offer", "Festival Sale", "Clearance Sale", "New Product"];

export default function Campaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [form, setForm] = useState({ campaign_type: "Weekend Offer", offer_text: "" });
  const [result, setResult] = useState<{ message: string; image_prompt: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setBusinessId(data.id);
      setPageLoading(false);
    });
  }, [user]);

  const generate = async () => {
    if (!form.offer_text) { toast({ title: t("enterOffer"), variant: "destructive" }); return; }
    if (!businessId) { toast({ title: t("setupBusinessFirst"), variant: "destructive" }); return; }
    setLoading(true); setResult(null);
    try {
      const resp = await supabase.functions.invoke("generate-campaign", {
        body: { business_id: businessId, campaign_type: form.campaign_type, offer_text: form.offer_text },
      });
      if (resp.error) throw resp.error;
      const message = resp.data?.message || "";
      const image_prompt = resp.data?.image_prompt || "";
      setResult({ message, image_prompt });
      await supabase.from("campaigns").insert({ business_id: businessId, message, poster_url: null });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message || "Failed to generate", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast({ title: t("copiedToClipboard") }); };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">{t("aiCampaigns")} 📣</h1>
        <p className="text-muted-foreground mb-6">{t("generateMarketing")}</p>

        {pageLoading ? (
          <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>{t("campaignType")}</Label>
                  <Select value={form.campaign_type} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{campaignTypes.map((ct) => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t("offerPromotion")}</Label><Textarea value={form.offer_text} onChange={(e) => setForm({ ...form, offer_text: e.target.value })} placeholder={t("offerPlaceholder")} rows={3} /></div>
                <Button onClick={generate} disabled={loading || !businessId} className="w-full gradient-primary text-primary-foreground gap-2">
                  <Sparkles size={16} />{loading ? t("generating") : t("generateCampaign")}
                </Button>
                {!businessId && <p className="text-xs text-destructive">{t("setupBusinessFirst")}</p>}
              </CardContent>
            </Card>
            {result && (
              <div className="space-y-4 animate-fade-in">
                <Card><CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold font-display">{t("marketingMessage")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => copy(result.message)} className="gap-1"><Copy size={14} /> {t("copy")}</Button>
                  </div>
                  <div className="rounded-lg bg-accent p-4 whitespace-pre-wrap text-sm">{result.message}</div>
                </CardContent></Card>
                <Card><CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold font-display">{t("imagePrompt")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => copy(result.image_prompt)} className="gap-1"><Copy size={14} /> {t("copy")}</Button>
                  </div>
                  <div className="rounded-lg bg-accent p-4 whitespace-pre-wrap text-sm">{result.image_prompt}</div>
                </CardContent></Card>
                <Card><CardContent className="p-6">
                  <h3 className="font-semibold font-display mb-3">{t("posterPreview")}</h3>
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center h-48">
                    <p className="text-muted-foreground text-sm">{t("posterPlaceholder")}</p>
                  </div>
                </CardContent></Card>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
