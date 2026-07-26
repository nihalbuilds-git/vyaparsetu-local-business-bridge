import { createClient } from "@supabase/supabase-js";
import { auditMcp } from "../audit";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_expenses",
  title: "List expenses",
  description: "List recent expenses for the signed-in user's business.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx).from("expenses").select("*").order("date", { ascending: false }).limit(limit ?? 50);
    if (error) {
      await auditMcp(ctx, "list_expenses", "error", { message: error.message });
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    await auditMcp(ctx, "list_expenses", "ok", { count: (data ?? []).length });
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { expenses: data ?? [] } };
  },
});
