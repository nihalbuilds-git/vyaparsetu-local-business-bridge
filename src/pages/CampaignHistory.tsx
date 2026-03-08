import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Eye, CalendarDays, Send } from "lucide-react";
import SendCampaignDialog from "@/components/SendCampaignDialog";

interface Campaign { id: string; message: string | null; poster_url: string | null; created_at: string; }

export default function CampaignHistory() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Campaign | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
      if (!biz) { setLoading(false); return; }
      const { data } = await supabase.from("campaigns").select("*").eq("business_id", biz.id).order("created_at", { ascending: false });
      setCampaigns((data as Campaign[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">{t("campaignHistory")}</h1>
        <p className="text-muted-foreground mb-6">{t("viewPastCampaigns")}</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-4 space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-full" /></CardContent></Card>)}
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Megaphone size={40} className="mb-3 opacity-40" /><p>{t("noCampaignsYet")}</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <CalendarDays size={12} />
                        {new Date(c.created_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <p className="text-sm line-clamp-2">{c.message || t("noMessage")}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 shrink-0" onClick={() => setSelected(c)}>
                      <Eye size={14} /> {t("view")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">{t("campaignDetails")}</DialogTitle></DialogHeader>
            {selected && (
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground">
                  {t("created")}: {new Date(selected.created_at).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="rounded-lg bg-accent p-4 whitespace-pre-wrap text-sm">{selected.message || t("noMessage")}</div>
                {selected.poster_url && <img src={selected.poster_url} alt="Campaign poster" className="rounded-lg w-full" />}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
