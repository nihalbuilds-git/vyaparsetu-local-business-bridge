import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Users, CalendarCheck, IndianRupee, Megaphone, ArrowRight } from "lucide-react";

const features = [
  { icon: Users, title: "Workers Management", desc: "Add, edit and manage your team easily" },
  { icon: CalendarCheck, title: "Daily Attendance", desc: "Mark attendance with one tap" },
  { icon: IndianRupee, title: "Salary Calculator", desc: "Auto-calculate monthly wages" },
  { icon: Megaphone, title: "AI Campaigns", desc: "Generate marketing messages with AI" },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg">
          <span className="text-4xl font-bold text-primary-foreground font-display">V</span>
        </div>
        <h1 className="mb-3 text-4xl md:text-5xl font-bold font-display">
          <span className="text-gradient-primary">VyaparSetu</span>
        </h1>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          The simplest business tool for local Indian shopkeepers. Manage workers, attendance, salary & more.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground gap-2 px-6 py-3 text-base">
            Get Started <ArrowRight size={16} />
          </Button>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid max-w-2xl gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border/50 bg-card p-6 text-left hover:shadow-lg transition-shadow animate-fade-in">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Icon size={20} className="text-accent-foreground" />
              </div>
              <h3 className="font-semibold font-display mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
