import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Append an audit_logs row for an MCP tool call. Uses the caller's own token so
 * RLS keys the row to their auth.uid(). Fire-and-forget: never throws.
 */
export async function auditMcp(
  ctx: ToolContext,
  tool: string,
  status: "ok" | "error" | "denied" = "ok",
  metadata: Record<string, unknown> = {}
) {
  try {
    if (!ctx.isAuthenticated()) return;
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await client.from("audit_logs").insert({
      user_id: ctx.getUserId(),
      event_type: `mcp.${tool}`,
      resource: "mcp",
      status,
      metadata,
      user_agent: "mcp-client",
    } as never);
  } catch {
    /* silent — audit logging must never break a tool call */
  }
}
