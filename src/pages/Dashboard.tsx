import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [shopName, setShopName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("businesses").select("name").eq("owner_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.name) setShopName(data.name);
    });
  }, [user]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">
          {shopName ? shopName : "Welcome"}
        </h1>
        <p className="text-muted-foreground mb-8">{today}</p>

        <div className="grid gap-6 sm:grid-cols-2 max-w-xl">
          <Link to="/campaign">
            <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
                <Megaphone className="text-primary" size={36} />
                <span className="text-lg font-bold font-display group-hover:text-primary transition-colors">Create AI Campaign</span>
              </CardContent>
            </Card>
          </Link>
          <Link to="/workers">
            <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
                <Users className="text-primary" size={36} />
                <span className="text-lg font-bold font-display group-hover:text-primary transition-colors">Workers & Attendance</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}