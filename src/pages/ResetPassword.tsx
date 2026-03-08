import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasSession(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast({ title: t("passwordMin6"), variant: "destructive" }); return; }
    if (password !== confirmPassword) { toast({ title: t("passwordsMismatch"), variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: t("passwordUpdatedSuccess") });
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <span className="text-3xl font-bold text-primary-foreground font-display">V</span>
          </div>
          <CardTitle className="font-display text-2xl">{t("resetPassword")}</CardTitle>
          <CardDescription>{success ? t("passwordUpdated") : t("enterNewPassword")}</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle className="text-primary" size={48} />
              <p className="text-sm text-muted-foreground">{t("redirecting")}</p>
            </div>
          ) : !hasSession ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-sm text-muted-foreground">{t("resetLinkInfo")}</p>
              <Button variant="outline" onClick={() => navigate("/login")}>{t("backToLogin")}</Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="new-password" type="password" placeholder={t("atLeast6Chars")} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirm-password" type="password" placeholder={t("reEnterPassword")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? t("updating") : t("updatePassword")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
