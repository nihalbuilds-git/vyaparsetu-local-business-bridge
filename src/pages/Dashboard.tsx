import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Users, History } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("businesses").select("name").eq("owner_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.name) setShopName(data.name);
      setLoading(false);
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
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mt-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold font-display mb-1">
              {shopName ? shopName : "Welcome"}
            </h1>
            <p className="text-muted-foreground mb-8">{today}</p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
              <Link to="/campaign">
                <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
                    <Megaphone className="text-primary" size={36} />
                    <span className="text-lg font-bold font-display group-hover:text-primary transition-colors">AI Campaigns</span>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/workers">
                <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
                    <Users className="text-primary" size={36} />
                    <span className="text-lg font-bold font-display group-hover:text-primary transition-colors">Workers</span>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/campaign-history">
                <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
                    <History className="text-primary" size={36} />
                    <span className="text-lg font-bold font-display group-hover:text-primary transition-colors">Campaign History</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
