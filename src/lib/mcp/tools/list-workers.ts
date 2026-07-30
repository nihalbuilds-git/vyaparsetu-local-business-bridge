import { createClient } from "@supabase/supabase-js";
import { auditMcp } from "../audit";
import { mcpRateLimited } from "../rate-limit";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_workers",
  title: "List workers",
  description: "List all workers (employees) for the signed-in user's business with name, role, phone, and daily salary.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const limited = mcpRateLimited(ctx, "list_workers");
    if (limited) {
      await auditMcp(ctx, "list_workers", "denied", { reason: "rate_limit" });
      return limited;
    }
    const { data, error } = await sb(ctx)
      .from("workers")
      .select("id,name,role,phone,daily_salary,joined_date")
      .order("created_at", { ascending: false });
    if (error) {
      await auditMcp(ctx, "list_workers", "error", { message: error.message });
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    await auditMcp(ctx, "list_workers", "ok", { count: (data ?? []).length });
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { workers: data ?? [] } };
  },
});
