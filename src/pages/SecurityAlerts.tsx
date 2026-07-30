import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  ShieldAlert,
  Activity,
  Search,
  RefreshCw,
  BellRing,
  CheckCheck,
  AlertTriangle,
  Info,
  XCircle,
  ChevronRight,
} from "lucide-react";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  subDays,
  subHours,
} from "date-fns";
import { toast } from "sonner";

interface AuditRow {
  id: string;
  event_type: string;
  resource: string | null;
  status: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface AlertRow {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

type RangeKey = "24h" | "7d" | "30d" | "all";

const RANGE_LABEL: Record<RangeKey, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

const isCritical = (r: AuditRow) =>
  r.status === "denied" || r.status === "error" || r.event_type === "client.error";

const statusStyle = (status: string) => {
  if (status === "denied") return "bg-destructive/10 text-destructive border-destructive/30";
  if (status === "error") return "bg-destructive/10 text-destructive border-destructive/30";
  if (status === "success") return "bg-primary/10 text-primary border-primary/30";
  return "bg-muted text-muted-foreground border-border";
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "denied") return <XCircle size={14} className="text-destructive" />;
  if (status === "error") return <AlertTriangle size={14} className="text-destructive" />;
  return <Info size={14} className="text-muted-foreground" />;
};

const dayLabel = (d: Date) => {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM yyyy");
};

export default function SecurityAlerts() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<AuditRow | null>(null);

  // filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [range, setRange] = useState<RangeKey>("7d");
  const [severity, setSeverity] = useState<string>("all");

  const load = async () => {
    const [{ data: logs, error: logErr }, { data: notes, error: noteErr }] = await Promise.all([
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("notifications")
        .select("id,title,message,type,is_read,created_at")
        .eq("type", "security_alert")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (logErr || noteErr) toast.error("Could not load security data");
    setEvents((logs as unknown as AuditRow[]) || []);
    setAlerts((notes as unknown as AlertRow[]) || []);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unread.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unread);
    if (error) return toast.error("Could not update alerts");
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    toast.success("All alerts marked as read");
  };

  const eventTypes = useMemo(
    () => Array.from(new Set(events.map((e) => e.event_type))).sort(),
    [events]
  );

  const filtered = useMemo(() => {
    const cutoff =
      range === "24h"
        ? subHours(new Date(), 24)
        : range === "7d"
        ? subDays(new Date(), 7)
        : range === "30d"
        ? subDays(new Date(), 30)
        : null;
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (cutoff && new Date(e.created_at) < cutoff) return false;
      if (status !== "all" && e.status !== status) return false;
      if (eventType !== "all" && e.event_type !== eventType) return false;
      if (severity === "critical" && !isCritical(e)) return false;
      if (severity === "normal" && isCritical(e)) return false;
      if (q) {
        const hay = [e.event_type, e.resource, e.status, e.ip_address, e.user_agent]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, range, status, eventType, severity, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, AuditRow[]>();
    filtered.forEach((e) => {
      const key = dayLabel(new Date(e.created_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const criticalCount = filtered.filter(isCritical).length;
  const unreadAlerts = alerts.filter((a) => !a.is_read).length;
  const activeFilters =
    (status !== "all" ? 1 : 0) +
    (eventType !== "all" ? 1 : 0) +
    (severity !== "all" ? 1 : 0) +
    (query ? 1 : 0);

  const resetFilters = () => {
    setStatus("all");
    setEventType("all");
    setSeverity("all");
    setQuery("");
    setRange("7d");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl gradient-primary p-2.5">
              <ShieldAlert size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold font-display">Security Alerts</h1>
              <p className="text-sm text-muted-foreground">
                Review generated alerts and trace every audited event on your account.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline ml-1.5">Refresh</span>
          </Button>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Open alerts", value: unreadAlerts, icon: BellRing },
            { label: "Critical events", value: criticalCount, icon: AlertTriangle },
            { label: "Events shown", value: filtered.length, icon: Activity },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl border-border/50">
              <CardContent className="p-4">
                <s.icon size={16} className="text-muted-foreground mb-2" />
                <p className="text-2xl font-bold font-display leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="alerts">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="alerts">
              Alerts {unreadAlerts > 0 && <span className="ml-1.5 text-[10px] rounded-full bg-destructive text-destructive-foreground px-1.5">{unreadAlerts}</span>}
            </TabsTrigger>
            <TabsTrigger value="timeline">Event timeline</TabsTrigger>
          </TabsList>

          {/* ALERTS */}
          <TabsContent value="alerts" className="space-y-3 mt-4">
            {alerts.length > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadAlerts === 0}>
                  <CheckCheck size={14} className="mr-1.5" /> Mark all read
                </Button>
              </div>
            )}
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
            ) : alerts.length === 0 ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <ShieldAlert className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No security alerts. Your account looks healthy.</p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((a) => (
                <Card
                  key={a.id}
                  className={`rounded-2xl border-border/50 ${a.is_read ? "" : "border-destructive/40 bg-destructive/5"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-destructive/10 p-2 shrink-0">
                        <AlertTriangle size={16} className="text-destructive" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{a.title}</p>
                          {!a.is_read && (
                            <Badge variant="destructive" className="text-[10px] uppercase">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                        <p className="text-[11px] text-muted-foreground/70 mt-2">
                          {format(new Date(a.created_at), "d MMM yyyy, h:mm a")} ·{" "}
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="space-y-4 mt-4">
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search event, resource, IP or device…"
                    className="pl-9 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => (
                        <SelectItem key={k} value={k}>{RANGE_LABEL[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Severity" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severities</SelectItem>
                      <SelectItem value="critical">Critical only</SelectItem>
                      <SelectItem value="normal">Normal only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {["success", "denied", "error", "info"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Event" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All events</SelectItem>
                      {eventTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeFilters > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {activeFilters} filter{activeFilters > 1 ? "s" : ""} active
                    </p>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>Clear</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Activity className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No events match these filters.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {grouped.map(([day, rows]) => (
                  <div key={day}>
                    <div className="flex items-center gap-3 mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</p>
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[11px] text-muted-foreground">{rows.length}</span>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" aria-hidden />
                      <div className="space-y-2">
                        {rows.map((r) => (
                          <div key={r.id} className="relative">
                            <span
                              className={`absolute -left-[22px] top-4 h-3 w-3 rounded-full border-2 border-background ${
                                isCritical(r) ? "bg-destructive" : "bg-primary/60"
                              }`}
                              aria-hidden
                            />
                            <button
                              onClick={() => setSelected(r)}
                              className="w-full text-left rounded-xl border border-border/50 bg-card hover:bg-accent/40 transition-colors p-3.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <StatusIcon status={r.status} />
                                    <code className="text-xs font-mono font-semibold">{r.event_type}</code>
                                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${statusStyle(r.status)}`}>
                                      {r.status}
                                    </Badge>
                                  </div>
                                  {r.resource && (
                                    <p className="text-xs text-muted-foreground truncate">{r.resource}</p>
                                  )}
                                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                    {format(new Date(r.created_at), "h:mm:ss a")}
                                    {r.ip_address ? ` · ${r.ip_address}` : ""}
                                  </p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-1" />
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Details */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-5 pb-3 border-b">
            <SheetTitle className="font-display">Event details</SheetTitle>
          </SheetHeader>
          {selected && (
            <ScrollArea className="h-[calc(100vh-5rem)]">
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono font-semibold">{selected.event_type}</code>
                  <Badge variant="outline" className={`text-[10px] uppercase ${statusStyle(selected.status)}`}>
                    {selected.status}
                  </Badge>
                  {isCritical(selected) && (
                    <Badge variant="destructive" className="text-[10px] uppercase">Critical</Badge>
                  )}
                </div>
                {[
                  ["When", format(new Date(selected.created_at), "d MMM yyyy, h:mm:ss a")],
                  ["Resource", selected.resource || "—"],
                  ["IP address", selected.ip_address || "—"],
                  ["Device", selected.user_agent || "—"],
                  ["Event ID", selected.id],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm break-words">{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Metadata</p>
                  <pre className="text-[11px] font-mono bg-muted rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selected.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
