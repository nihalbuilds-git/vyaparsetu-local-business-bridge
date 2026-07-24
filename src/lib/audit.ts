import { supabase } from "@/integrations/supabase/client";

/**
 * Append an audit-log record for the current user. Fire-and-forget: logging
 * never blocks the caller and never throws. RLS ensures a user can only write
 * rows keyed to their own auth.uid().
 */
export async function logAudit(
  eventType: string,
  opts: { resource?: string; metadata?: Record<string, unknown>; status?: "ok" | "error" | "denied" } = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: eventType,
      resource: opts.resource ?? null,
      metadata: opts.metadata ?? {},
      status: opts.status ?? "ok",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    } as never);
  } catch {
    // Silent — audit logging must never break the UX.
  }
}

/**
 * Extract a storage object path from either a raw path (`<uid>/<file>`) or a
 * legacy public URL (`.../storage/v1/object/public/<bucket>/<path>`).
 */
export function extractStoragePath(bucket: string, value: string | null): string | null {
  if (!value) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const signedMarker = `/storage/v1/object/sign/${bucket}/`;
  const idx = value.indexOf(marker);
  if (idx !== -1) return value.slice(idx + marker.length).split("?")[0];
  const sidx = value.indexOf(signedMarker);
  if (sidx !== -1) return value.slice(sidx + signedMarker.length).split("?")[0];
  return value;
}
