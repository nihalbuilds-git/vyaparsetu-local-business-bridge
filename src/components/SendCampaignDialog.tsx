import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Send, MessageSquare, Mail, Link2, Phone, Check } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: string | null;
}

type Channel = "whatsapp" | "sms" | "email" | "link";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  posterUrl?: string | null;
}

export default function SendCampaignDialog({ open, onOpenChange, message, posterUrl }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setSent(false);
    setSelected(new Set());
    setSearch("");
    supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("name")
      .then(({ data }) => {
        setContacts((data as Contact[]) || []);
        setLoading(false);
      });
  }, [open, user]);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.category && c.category.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  };

  const campaignText = posterUrl ? `${message}\n\n🖼️ ${posterUrl}` : message;

  const handleSend = () => {
    const selectedContacts = contacts.filter(c => selected.has(c.id));
    if (selectedContacts.length === 0) {
      toast({ title: t("selectAtLeastOne"), variant: "destructive" });
      return;
    }

    const encodedMsg = encodeURIComponent(campaignText);

    selectedContacts.forEach((c) => {
      const phone = c.phone ? `91${c.phone}` : null;

      switch (channel) {
        case "whatsapp":
          if (phone) window.open(`https://wa.me/${phone}?text=${encodedMsg}`, "_blank");
          break;
        case "sms":
          if (phone) window.open(`sms:+${phone}?body=${encodedMsg}`, "_blank");
          break;
        case "email":
          if (c.email) window.open(`mailto:${c.email}?subject=${encodeURIComponent("Special Offer!")}&body=${encodedMsg}`, "_blank");
          break;
        case "link":
          navigator.clipboard.writeText(campaignText);
          break;
      }
    });

    if (channel === "link") {
      toast({ title: t("copiedToClipboard") });
    } else {
      toast({ title: t("campaignSentSuccess", { count: String(selectedContacts.length) }) });
    }
    setSent(true);
  };

  const channels: { id: Channel; icon: typeof Send; label: string; needsPhone?: boolean; needsEmail?: boolean }[] = [
    { id: "whatsapp", icon: MessageSquare, label: "WhatsApp", needsPhone: true },
    { id: "sms", icon: Phone, label: "SMS", needsPhone: true },
    { id: "email", icon: Mail, label: "Email", needsEmail: true },
    { id: "link", icon: Link2, label: t("copyLink") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send size={18} /> {t("sendCampaign")}
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Check size={28} className="text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{t("campaignSent")} 🎉</h3>
            <p className="text-sm text-muted-foreground text-center">{t("campaignSentDesc")}</p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">{t("done")}</Button>
          </div>
        ) : (
          <>
            {/* Channel selector */}
            <div className="flex gap-2 mb-3">
              {channels.map(ch => (
                <Button
                  key={ch.id}
                  variant={channel === ch.id ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 gap-1 text-xs ${channel === ch.id ? "gradient-primary text-primary-foreground" : ""}`}
                  onClick={() => setChannel(ch.id)}
                >
                  <ch.icon size={14} /> {ch.label}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchContacts")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Select all */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button onClick={selectAll} className="hover:text-foreground transition-colors">
                {selected.size === filtered.length && filtered.length > 0 ? t("deselectAll") : t("selectAll")}
              </button>
              <span>{selected.size} {t("selected")}</span>
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-auto space-y-1 min-h-0 max-h-[300px] pr-1">
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {contacts.length === 0 ? t("noContactsYet") : t("noContactsFound")}
                </div>
              ) : (
                filtered.map(c => {
                  const disabled = (channel === "whatsapp" || channel === "sms") && !c.phone
                    || channel === "email" && !c.email;
                  return (
                    <button
                      key={c.id}
                      onClick={() => !disabled && toggleSelect(c.id)}
                      disabled={disabled}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left text-sm transition-all ${
                        disabled ? "opacity-40 cursor-not-allowed border-border" :
                        selected.has(c.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox checked={selected.has(c.id)} disabled={disabled} className="pointer-events-none" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c.phone && <span>{c.phone}</span>}
                          {c.phone && c.email && <span> · </span>}
                          {c.email && <span>{c.email}</span>}
                        </div>
                      </div>
                      {c.category && (
                        <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded shrink-0">{c.category}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={selected.size === 0}
              className="w-full gradient-primary text-primary-foreground gap-2 mt-2"
            >
              <Send size={16} />
              {t("sendTo", { count: String(selected.size) })}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
