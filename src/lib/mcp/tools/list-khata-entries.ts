import { createClient } from "@supabase/supabase-js";
import { auditMcp } from "../audit";
import { mcpRateLimited } from "../rate-limit";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_khata_entries",
  title: "List Khata entries",
  description: "List credit/debit ledger (Khata) entries for the signed-in user's business. Optionally filter by customer name.",
  inputSchema: {
    customer_name: z.string().optional().describe("Optional: filter by customer name (partial match)."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ customer_name, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const limited = mcpRateLimited(ctx, "list_khata_entries");
    if (limited) {
      await auditMcp(ctx, "list_khata_entries", "denied", { reason: "rate_limit" });
      return limited;
    }
    let q = sb(ctx).from("khata_entries").select("id,customer_name,customer_phone,amount,entry_type,description,date").order("date", { ascending: false }).limit(limit ?? 50);
    if (customer_name) q = q.ilike("customer_name", `%${customer_name}%`);
    const { data, error } = await q;
    if (error) {
      await auditMcp(ctx, "list_khata_entries", "error", { message: error.message });
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    await auditMcp(ctx, "list_khata_entries", "ok", { count: (data ?? []).length });
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { entries: data ?? [] } };
  },
});
