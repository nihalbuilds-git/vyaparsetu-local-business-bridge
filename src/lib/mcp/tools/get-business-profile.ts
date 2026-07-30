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
  name: "get_business_profile",
  title: "Get business profile",
  description: "Returns the signed-in user's VyaparSetu business profile(s): name, category, address.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const limited = mcpRateLimited(ctx, "get_business_profile");
    if (limited) {
      await auditMcp(ctx, "get_business_profile", "denied", { reason: "rate_limit" });
      return limited;
    }
    const { data, error } = await sb(ctx).from("businesses").select("id,name,category,address,created_at").eq("owner_id", ctx.getUserId());
    if (error) {
      await auditMcp(ctx, "get_business_profile", "error", { message: error.message });
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    await auditMcp(ctx, "get_business_profile", "ok", { count: (data ?? []).length });
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { businesses: data ?? [] } };
  },
});
