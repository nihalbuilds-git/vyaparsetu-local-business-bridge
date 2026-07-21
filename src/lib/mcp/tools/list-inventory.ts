import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_inventory",
  title: "List inventory",
  description: "List all inventory items (stock) for the signed-in user's business with quantity, unit, and price.",
  inputSchema: {
    low_stock_only: z.boolean().optional().describe("If true, only return items at or below their low-stock threshold."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ low_stock_only }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx).from("inventory_items").select("*").order("name");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const items = low_stock_only
      ? (data ?? []).filter((i: any) => typeof i.low_stock_threshold === "number" && i.quantity <= i.low_stock_threshold)
      : data ?? [];
    return { content: [{ type: "text", text: JSON.stringify(items) }], structuredContent: { items } };
  },
});
