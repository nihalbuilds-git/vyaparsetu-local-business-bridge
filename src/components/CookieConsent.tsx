import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "vyaparsetu_cookie_consent_v1";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, ts: Date.now() }));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, ts: Date.now() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100] animate-fade-in">
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-primary/10 p-4 md:p-5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary grid place-items-center shrink-0">
            <Cookie size={18} className="text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm text-foreground mb-1">We use cookies 🍪</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use essential cookies for sign-in & session management. No third-party tracking. Read our{" "}
              <Link to="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={accept} className="gradient-primary text-primary-foreground rounded-lg h-8 text-xs font-bold flex-1">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={decline} className="rounded-lg h-8 text-xs font-bold flex-1">
                Decline
              </Button>
            </div>
          </div>
          <button onClick={decline} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
