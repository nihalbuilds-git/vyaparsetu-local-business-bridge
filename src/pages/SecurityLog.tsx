import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditRow {
  id: string;
  event_type: string;
  resource: string | null;
  status: string;
  metadata: Record<string, unknown>;
  user_agent: string | null;
  created_at: string;
}

const statusVariant = (s: string) =>
  s === "error" || s === "denied" ? "destructive" : "secondary";

export default function SecurityLog() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("audit_logs" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data as unknown as AuditRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl gradient-primary p-2.5">
            <ShieldCheck size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-display">Security Activity</h1>
            <p className="text-sm text-muted-foreground">Last 100 auth, storage, and function events on your account.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : rows.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Activity className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No activity recorded yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Card key={r.id} className="rounded-xl border-border/40">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs font-mono font-semibold text-foreground">{r.event_type}</code>
                      <Badge variant={statusVariant(r.status)} className="text-[10px] uppercase tracking-wide">{r.status}</Badge>
                    </div>
                    {r.resource && <p className="text-xs text-muted-foreground truncate">{r.resource}</p>}
                    {r.user_agent && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{r.user_agent}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
