import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast({ title: lang === "hi" ? "सभी पढ़ लिए गए" : "All marked as read" });
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const requestBrowserPermission = async () => {
    if (!("Notification" in window)) {
      toast({ title: t("error"), description: lang === "hi" ? "आपका ब्राउज़र नोटिफिकेशन सपोर्ट नहीं करता" : "Your browser doesn't support notifications", variant: "destructive" });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      toast({ title: lang === "hi" ? "नोटिफिकेशन चालू!" : "Notifications enabled!" });
      new Notification("VyaparSetu", { body: lang === "hi" ? "अब आपको अलर्ट मिलेंगे" : "You'll now receive alerts" });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle size={18} className="text-amber-500" />;
      case "success": return <CheckCircle2 size={18} className="text-emerald-500" />;
      default: return <Info size={18} className="text-primary" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold font-display">{t("notificationsTitle")}</h1>
            <p className="text-muted-foreground text-sm">{t("notificationsSubtext")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={requestBrowserPermission}>
              <Bell size={16} className="mr-1" />
              {lang === "hi" ? "ब्राउज़र अलर्ट चालू करें" : "Enable Push"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <Check size={16} className="mr-1" />
                {lang === "hi" ? "सभी पढ़ें" : "Mark All Read"}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <Card className="rounded-2xl border-border/40">
            <CardContent className="py-16 text-center">
              <Bell size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{t("noNotifications")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card key={n.id} className={`rounded-2xl border-border/40 transition-all ${!n.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0" onClick={() => !n.is_read && markAsRead(n.id)} role="button">
                    <p className={`text-sm font-semibold ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.created_at).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(n.id)}>
                    <Trash2 size={14} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
