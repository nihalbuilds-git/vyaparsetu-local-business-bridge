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
import { Sparkles, Copy, Download, Share2, Image as ImageIcon } from "lucide-react";

const campaignTypes = ["New Offer", "Festival Sale", "Clearance Sale", "New Product"];

export default function Campaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [form, setForm] = useState({ campaign_type: "New Offer", offer_text: "" });
  const [result, setResult] = useState<{ message: string; image_prompt: string; poster_url: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setBusinessId(data.id);
      setPageLoading(false);
    });
  }, [user]);

  const generate = async (posterOnly = false) => {
    if (!form.offer_text) { toast({ title: t("enterOffer"), variant: "destructive" }); return; }
    if (!businessId) { toast({ title: t("setupBusinessFirst"), variant: "destructive" }); return; }
    
    if (posterOnly) {
      setPosterLoading(true);
      if (result) setResult({ ...result, poster_url: null });
    } else {
      setLoading(true); setResult(null);
    }

    try {
      const body: any = { business_id: businessId, campaign_type: form.campaign_type, offer_text: form.offer_text };
      if (posterOnly && result) {
        body.poster_only = true;
        body.existing_message = result.message;
        body.existing_image_prompt = result.image_prompt;
      }
      const resp = await supabase.functions.invoke("generate-campaign", { body });
      if (resp.error) throw resp.error;
      const message = resp.data?.message || "";
      const image_prompt = resp.data?.image_prompt || "";
      const poster_url = resp.data?.poster_url || null;
      setResult({ message, image_prompt, poster_url });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message || "Failed to generate", variant: "destructive" });
    } finally { setLoading(false); setPosterLoading(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast({ title: t("copiedToClipboard") }); };

  const downloadPoster = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `campaign-poster-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Poster downloaded!" });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const sharePoster = (url: string) => {
    const text = result?.message || "Check out our new offer!";
    window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n\n" + url)}`, "_blank");
  };

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
                <Button onClick={() => generate(false)} disabled={loading || posterLoading || !businessId} className="w-full gradient-primary text-primary-foreground gap-2">
                  <Sparkles size={16} />
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {t("generating")}
                    </span>
                  ) : t("generateCampaign")}
                </Button>
                {!businessId && <p className="text-xs text-destructive">{t("setupBusinessFirst")}</p>}
                {loading && (
                  <p className="text-xs text-muted-foreground text-center animate-pulse">
                    ✨ AI is creating your marketing message and poster... This may take 15-30 seconds.
                  </p>
                )}
              </CardContent>
            </Card>
            {result && (
              <div className="space-y-4 animate-fade-in">
                {/* Poster */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold font-display mb-3 flex items-center gap-2">
                      <ImageIcon size={18} className="text-primary" /> {t("posterPreview")}
                    </h3>
                    {result.poster_url ? (
                      <div className="space-y-3">
                        <div className="rounded-lg overflow-hidden border border-border">
                          <img
                            src={result.poster_url}
                            alt="Campaign poster"
                            className="w-full h-auto"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => downloadPoster(result.poster_url!)}>
                            <Download size={14} /> Download
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => sharePoster(result.poster_url!)}>
                            <Share2 size={14} /> WhatsApp
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center h-48">
                        <p className="text-muted-foreground text-sm">{t("posterPlaceholder")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Marketing Message */}
                <Card><CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold font-display">{t("marketingMessage")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => copy(result.message)} className="gap-1"><Copy size={14} /> {t("copy")}</Button>
                  </div>
                  <div className="rounded-lg bg-accent p-4 whitespace-pre-wrap text-sm">{result.message}</div>
                </CardContent></Card>

                {/* Image Prompt */}
                <Card><CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold font-display">{t("imagePrompt")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => copy(result.image_prompt)} className="gap-1"><Copy size={14} /> {t("copy")}</Button>
                  </div>
                  <div className="rounded-lg bg-accent p-4 whitespace-pre-wrap text-sm">{result.image_prompt}</div>
                </CardContent></Card>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
