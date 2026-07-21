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
  name: "add_khata_entry",
  title: "Add Khata entry",
  description: "Add a credit ('given') or debit ('received') Khata entry for a customer of the signed-in user's business.",
  inputSchema: {
    business_id: z.string().uuid().describe("Business ID (get from get_business_profile)."),
    customer_name: z.string().min(1),
    amount: z.number().positive(),
    entry_type: z.enum(["given", "received"]).describe("'given' = credit given to customer (they owe you). 'received' = payment received."),
    customer_phone: z.string().optional(),
    description: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx).from("khata_entries").insert(input).select().single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Added ₹${input.amount} ${input.entry_type} for ${input.customer_name}` }], structuredContent: { entry: data } };
  },
});
