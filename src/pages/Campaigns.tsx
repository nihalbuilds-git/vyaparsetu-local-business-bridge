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
import {
  Sparkles, Copy, Download, Share2, Image as ImageIcon,
  Pencil, Check, Send, Wand2, Zap, FileText
} from "lucide-react";
import SendCampaignDialog from "@/components/SendCampaignDialog";

const campaignTypes = ["New Offer", "Festival Sale", "Clearance Sale", "New Product"];
const platformOptions = [
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "facebook", label: "Facebook", icon: "📘" },
  { id: "sms", label: "SMS", icon: "📱" },
  { id: "email", label: "Email", icon: "📧" },
  { id: "general", label: "General", icon: "🌐" },
];

export default function Campaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [form, setForm] = useState({ campaign_type: "New Offer", offer_text: "" });
  const [result, setResult] = useState<{ message: string; image_prompt: string; poster_url: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [sendOpen, setSendOpen] = useState(false);

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
      <div className="animate-fade-in max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8 mb-6">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white/20 grid place-items-center">
              <Wand2 size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold font-display text-primary-foreground">
                {t("aiCampaigns")}
              </h1>
              <p className="text-primary-foreground/70 text-sm mt-1">{t("generateMarketing")}</p>
            </div>
          </div>
        </div>

        {pageLoading ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Input Form */}
            <Card className="mb-6 rounded-2xl border-border/40 shadow-sm">
              <CardContent className="p-5 md:p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} className="text-primary" />
                  <span className="text-sm font-bold font-display text-foreground">
                    {lang === "hi" ? "अभियान विवरण" : "Campaign Details"}
                  </span>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    {t("campaignType")}
                  </Label>
                  <Select value={form.campaign_type} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((ct) => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    {t("offerPromotion")}
                  </Label>
                  <Textarea
                    value={form.offer_text}
                    onChange={(e) => setForm({ ...form, offer_text: e.target.value })}
                    placeholder={t("offerPlaceholder")}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
                <Button
                  onClick={() => generate(false)}
                  disabled={loading || posterLoading || !businessId}
                  className="w-full gradient-primary text-primary-foreground gap-2 rounded-xl h-12 text-base font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {t("generating")}
                    </span>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      {t("generateCampaign")}
                    </>
                  )}
                </Button>
                {!businessId && <p className="text-xs text-destructive text-center">{t("setupBusinessFirst")}</p>}
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-accent">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    <p className="text-xs text-muted-foreground">
                      {lang === "hi" ? "✨ AI आपका मार्केटिंग मैसेज और पोस्टर बना रहा है..." : "✨ AI is crafting your marketing message & poster..."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <div className="space-y-4 animate-fade-in">
                {/* Send Campaign CTA */}
                <Button
                  onClick={() => setSendOpen(true)}
                  className="w-full gap-2 rounded-xl h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-base shadow-sm"
                  size="lg"
                >
                  <Send size={18} /> {t("sendCampaign")}
                </Button>

                {/* Poster Preview */}
                <Card className="rounded-2xl border-border/40 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-primary/5 to-accent px-5 py-3 border-b border-border/40 flex items-center gap-2">
                    <ImageIcon size={16} className="text-primary" />
                    <h3 className="font-bold font-display text-sm text-foreground">{t("posterPreview")}</h3>
                  </div>
                  <CardContent className="p-5">
                    {posterLoading ? (
                      <div className="rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center h-52 gap-3">
                        <span className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                        <p className="text-muted-foreground text-sm font-medium">
                          {lang === "hi" ? "🎨 पोस्टर बन रहा है..." : "🎨 Generating poster..."}
                        </p>
                      </div>
                    ) : result.poster_url ? (
                      <div className="space-y-4">
                        <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm">
                          <img src={result.poster_url} alt="Campaign poster" className="w-full h-auto" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-xl h-10 font-medium"
                            onClick={() => downloadPoster(result.poster_url!)}
                          >
                            <Download size={14} /> {lang === "hi" ? "डाउनलोड" : "Download"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-xl h-10 font-medium"
                            onClick={() => sharePoster(result.poster_url!)}
                          >
                            <Share2 size={14} /> WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-xl h-10 font-medium"
                            onClick={() => generate(true)}
                            disabled={posterLoading}
                          >
                            <ImageIcon size={14} /> {lang === "hi" ? "नया बनाएं" : "Regenerate"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center h-48 gap-2">
                          <ImageIcon size={28} className="text-muted-foreground/40" />
                          <p className="text-muted-foreground text-sm">{t("posterPlaceholder")}</p>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full gap-2 rounded-xl h-10 font-medium"
                          onClick={() => generate(true)}
                          disabled={posterLoading}
                        >
                          <ImageIcon size={14} /> {lang === "hi" ? "पोस्टर बनाएं" : "Generate Poster"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Marketing Message */}
                <Card className="rounded-2xl border-border/40 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-primary/5 to-accent px-5 py-3 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      <h3 className="font-bold font-display text-sm text-foreground">{t("marketingMessage")}</h3>
                    </div>
                    <div className="flex gap-1">
                      {editingMessage ? (
                        <Button variant="ghost" size="sm" onClick={() => setEditingMessage(false)} className="gap-1 text-primary h-8 rounded-lg text-xs">
                          <Check size={13} /> Done
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => { setEditedMessage(result.message); setEditingMessage(true); }} className="gap-1 h-8 rounded-lg text-xs">
                          <Pencil size={13} /> {lang === "hi" ? "संपादन" : "Edit"}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => copy(editingMessage ? editedMessage : result.message)} className="gap-1 h-8 rounded-lg text-xs">
                        <Copy size={13} /> {t("copy")}
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    {editingMessage ? (
                      <Textarea
                        value={editedMessage}
                        onChange={(e) => {
                          const val = e.target.value.slice(0, 1000);
                          setEditedMessage(val);
                          setResult({ ...result, message: val });
                        }}
                        rows={6}
                        className="text-sm rounded-xl resize-none"
                        maxLength={1000}
                      />
                    ) : (
                      <div className="rounded-xl bg-accent/50 border border-border/30 p-4 whitespace-pre-wrap text-sm leading-relaxed">
                        {result.message}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Image Prompt */}
                <Card className="rounded-2xl border-border/40 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-primary/5 to-accent px-5 py-3 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      <h3 className="font-bold font-display text-sm text-foreground">{t("imagePrompt")}</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copy(result.image_prompt)} className="gap-1 h-8 rounded-lg text-xs">
                      <Copy size={13} /> {t("copy")}
                    </Button>
                  </div>
                  <CardContent className="p-5">
                    <div className="rounded-xl bg-accent/50 border border-border/30 p-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {result.image_prompt}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
      {result && (
        <SendCampaignDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          message={result.message}
          posterUrl={result.poster_url}
        />
      )}
    </AppLayout>
  );
}
