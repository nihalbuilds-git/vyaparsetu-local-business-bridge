import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Phone, ShieldCheck, Mail, Lock, Globe, ArrowLeft } from "lucide-react";

type AuthMode = "phone" | "email";
type PhoneStep = "input" | "otp";
type EmailStep = "login" | "signup";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("email");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("input");
  const [emailStep, setEmailStep] = useState<EmailStep>("login");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length >= 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: t("validPhoneNumber"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formatted = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
      if (error) throw error;
      setPhoneStep("otp");
      toast({ title: t("otpSent"), description: t("checkSms", { phone: formatted }) });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast({ title: t("validOtp"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formatted = formatPhone(phone);
      const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: "sms" });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: t("verificationFailed"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: t("fillAllFields"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (emailStep === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: t("accountCreated"), description: t("verifyEmail") });
        setEmailStep("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: t("googleSignInFailed"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: t("enterEmailFirst"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: t("resetLinkSent"), description: t("checkInbox") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const heading =
    mode === "phone"
      ? phoneStep === "input" ? t("signInWithPhone") : t("verifyOtp")
      : emailStep === "login" ? t("logIn") : t("createAccount");

  const subtext =
    mode === "phone"
      ? phoneStep === "input" ? t("otpSmsHint") : t("enterCodeHint")
      : emailStep === "login" ? t("dontHaveAccount") : t("alreadyHaveAccount");

  const subtextAction =
    mode === "email"
      ? emailStep === "login" ? t("signUp") : t("signIn")
      : undefined;

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4 py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%),
            radial-gradient(ellipse 40% 40% at 10% 80%, hsl(var(--primary) / 0.06), transparent 60%),
            radial-gradient(ellipse 40% 40% at 90% 70%, hsl(var(--warning) / 0.08), transparent 60%)
          `
        }} />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "hi" : "en")} className="gap-2 rounded-xl border-border/50 backdrop-blur-sm">
          <Globe size={14} />
          {lang === "en" ? "हिन्दी" : "English"}
        </Button>
      </div>

      {/* Back to home */}
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 rounded-xl text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> {lang === "hi" ? "होम" : "Home"}
        </Button>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-6">
        {/* Logo & Heading */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25">
            <span className="text-3xl font-extrabold text-primary-foreground font-display">V</span>
          </div>
          <h1 className="text-foreground text-2xl md:text-3xl font-extrabold font-display">
            {heading}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {subtext}{" "}
            {subtextAction && (
              <button
                type="button"
                onClick={() => setEmailStep(emailStep === "login" ? "signup" : "login")}
                className="font-bold text-primary hover:text-primary/80 transition-colors"
              >
                {subtextAction}
              </button>
            )}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="rounded-2xl border-border/40 shadow-xl shadow-primary/5 overflow-hidden">
          <CardContent className="p-5 md:p-6 space-y-5">
            {/* Mode Toggle */}
            <div className="flex rounded-xl bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setMode("email")}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === "email"
                    ? "gradient-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail size={14} /> {t("email")}
              </button>
              <button
                type="button"
                onClick={() => setMode("phone")}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === "phone"
                    ? "gradient-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone size={14} /> {lang === "hi" ? "फ़ोन" : "Phone"}
              </button>
            </div>

            {/* Email form */}
            {mode === "email" && (
              <form onSubmit={handleEmail} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{t("email")}</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 rounded-xl h-11" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{t("password")}</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 rounded-xl h-11" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 gradient-primary text-primary-foreground rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {t("pleaseWait")}
                    </span>
                  ) : emailStep === "login" ? t("signIn") : t("createAccount")}
                </Button>
                {emailStep === "login" && (
                  <div className="text-center">
                    <button type="button" onClick={handleForgotPassword} className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                      {t("forgotPassword")}
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Phone OTP – input */}
            {mode === "phone" && phoneStep === "input" && (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{t("phoneNumber")}</Label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" type="tel" placeholder={t("phonePlaceholder")} value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 rounded-xl h-11" maxLength={15} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 gradient-primary text-primary-foreground rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {t("sendingOtp")}
                    </span>
                  ) : t("sendOtp")}
                </Button>
              </form>
            )}

            {/* Phone OTP – verify */}
            {mode === "phone" && phoneStep === "otp" && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{t("verificationCode")}</Label>
                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="otp" type="text" inputMode="numeric" placeholder={t("otpPlaceholder")} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="pl-10 text-center text-lg tracking-[0.5em] font-mono rounded-xl h-12" maxLength={6} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 gradient-primary text-primary-foreground rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      {t("verifying")}
                    </span>
                  ) : t("verifyAndLogin")}
                </Button>
                <button type="button" onClick={() => { setPhoneStep("input"); setOtp(""); }} className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                  {t("changePhone")}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative py-1">
              <span className="block w-full h-px bg-border" />
              <p className="inline-block w-fit text-xs bg-card px-3 text-muted-foreground absolute -top-2 inset-x-0 mx-auto font-medium">
                {t("orContinueWith")}
              </p>
            </div>

            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-border/50 rounded-xl bg-card text-foreground hover:bg-accent transition-all duration-200 disabled:opacity-50 font-bold text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                <path d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.2H272v95h146.9c-6.3 33.9-25 62.5-53.2 81.8v68.1h85.8c50.2-46.3 82-114.6 82-194.7z" fill="#4285F4" />
                <path d="M272 544.3c71.6 0 131.7-23.7 175.7-64.2l-85.8-68.1c-23.8 16-54.1 25.4-89.9 25.4-69.1 0-127.6-46.6-148.4-109.3h-89.6v68.9C77.7 480.5 168.5 544.3 272 544.3z" fill="#34A853" />
                <path d="M123.6 328.1c-10.8-32.1-10.8-66.9 0-99l-89.6-68.9c-39.1 77.6-39.1 168.3 0 245.9l89.6-68z" fill="#FBBC05" />
                <path d="M272 107.7c37.4-.6 73.5 13.2 101.1 38.7l75.4-75.4C403.4 24.5 341.4 0 272 0 168.5 0 77.7 63.8 34 159.2l89.6 68.9C144.4 154.3 202.9 107.7 272 107.7z" fill="#EA4335" />
              </svg>
              {t("continueWithGoogle")}
            </button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          VyaparSetu · {lang === "hi" ? "स्थानीय दुकानदारों का डिजिटल साथी" : "The Digital Partner for Local Shopkeepers"}
        </p>
      </div>
    </main>
  );
}
