import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Phone, ShieldCheck, Mail, Lock } from "lucide-react";

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
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formatted = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
      if (error) throw error;
      setPhoneStep("otp");
      toast({ title: "OTP sent!", description: `Check SMS on ${formatted}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast({ title: "Enter a valid 6-digit OTP", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formatted = formatPhone(phone);
      const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: "sms" });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (emailStep === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "Account created!", description: "Check your email to verify, then log in." });
        setEmailStep("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
      toast({ title: "Google sign-in failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset link sent!", description: "Check your email inbox." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const heading =
    mode === "phone"
      ? phoneStep === "input" ? "Sign in with Phone" : "Verify OTP"
      : emailStep === "login" ? "Log in to your account" : "Create your account";

  const subtext =
    mode === "phone"
      ? phoneStep === "input" ? "We'll send a 6-digit OTP via SMS" : "Enter the code sent to your phone"
      : emailStep === "login" ? "Don't have an account?" : "Already have an account?";

  const subtextAction =
    mode === "email"
      ? emailStep === "login" ? "Sign up" : "Sign in"
      : undefined;

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full space-y-8">
        {/* Logo & heading */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <span className="text-3xl font-bold text-primary-foreground font-display">V</span>
          </div>
          <h1 className="mt-5 text-foreground text-2xl font-bold sm:text-3xl font-display">
            {heading}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {subtext}{" "}
            {subtextAction && (
              <button
                type="button"
                onClick={() => setEmailStep(emailStep === "login" ? "signup" : "login")}
                className="font-medium text-primary hover:text-primary/80"
              >
                {subtextAction}
              </button>
            )}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "email" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Mail size={14} className="inline mr-1.5 -mt-0.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "phone" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Phone size={14} className="inline mr-1.5 -mt-0.5" /> Phone OTP
          </button>
        </div>

        {/* Email form */}
        {mode === "email" && (
          <form onSubmit={handleEmail} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Please wait..." : emailStep === "login" ? "Sign in" : "Create Account"}
            </Button>
            {emailStep === "login" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>
        )}

        {/* Phone OTP – input */}
        {mode === "phone" && phoneStep === "input" && (
          <form onSubmit={sendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-foreground font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
                maxLength={15}
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        )}

        {/* Phone OTP – verify */}
        {mode === "phone" && phoneStep === "otp" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp" className="text-foreground font-medium">Verification Code</Label>
              <div className="relative">
                <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pl-10 text-center text-lg tracking-[0.5em] font-mono h-11"
                  maxLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Login"}
            </Button>
            <button
              type="button"
              onClick={() => { setPhoneStep("input"); setOtp(""); }}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary"
            >
              ← Change phone number
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative">
          <span className="block w-full h-px bg-border" />
          <p className="inline-block w-fit text-sm bg-background px-2 text-muted-foreground absolute -top-2.5 inset-x-0 mx-auto">
            Or continue with
          </p>
        </div>

        {/* Google sign-in */}
        <div className="space-y-3 text-sm font-medium">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-x-3 py-2.5 border border-border rounded-lg bg-card text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
              <path d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.2H272v95h146.9c-6.3 33.9-25 62.5-53.2 81.8v68.1h85.8c50.2-46.3 82-114.6 82-194.7z" fill="#4285F4" />
              <path d="M272 544.3c71.6 0 131.7-23.7 175.7-64.2l-85.8-68.1c-23.8 16-54.1 25.4-89.9 25.4-69.1 0-127.6-46.6-148.4-109.3h-89.6v68.9C77.7 480.5 168.5 544.3 272 544.3z" fill="#34A853" />
              <path d="M123.6 328.1c-10.8-32.1-10.8-66.9 0-99l-89.6-68.9c-39.1 77.6-39.1 168.3 0 245.9l89.6-68z" fill="#FBBC05" />
              <path d="M272 107.7c37.4-.6 73.5 13.2 101.1 38.7l75.4-75.4C403.4 24.5 341.4 0 272 0 168.5 0 77.7 63.8 34 159.2l89.6 68.9C144.4 154.3 202.9 107.7 272 107.7z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </main>
  );
}
