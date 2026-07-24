import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await userClient.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Best-effort cleanup of business-scoped rows (FKs to businesses cascade)
    const { data: bizs } = await admin.from("businesses").select("id").eq("owner_id", userId);
    const bizIds = (bizs ?? []).map((b: { id: string }) => b.id);

    if (bizIds.length) {
      for (const t of ["attendance", "worker_advances", "workers", "khata_entries", "invoices", "inventory_items", "expenses", "contacts", "campaigns", "notifications"]) {
        await admin.from(t).delete().in("business_id", bizIds);
      }
      await admin.from("businesses").delete().in("id", bizIds);
    }

    // User-scoped rows
    for (const t of ["ai_messages", "ai_conversations", "payments", "user_subscriptions", "profiles"]) {
      await admin.from(t).delete().eq("user_id", userId);
    }

    // Audit BEFORE deleting the auth user (row will remain via ON DELETE SET NULL).
    try {
      await admin.from("audit_logs").insert({ user_id: userId, event_type: "account.deleted", status: "ok" });
    } catch (_) { /* silent */ }

    // Finally delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
