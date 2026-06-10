// Razorpay: Webhook Handler
// Public endpoint. Configure URL in Razorpay Dashboard → Webhooks.
// Requires secret: RAZORPAY_WEBHOOK_SECRET
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      return new Response("Webhook secret missing", { status: 500, headers: corsHeaders });
    }
    const signature = req.headers.get("x-razorpay-signature") || "";
    const rawBody = await req.text();
    const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (expected !== signature) {
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const type: string = event.event;
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const userId = payment?.notes?.user_id;
    const plan = payment?.notes?.plan;

    if (type === "payment.captured" && orderId) {
      await admin.from("payments").update({
        status: "paid",
        razorpay_payment_id: payment.id,
      }).eq("razorpay_order_id", orderId);

      if (userId && plan) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await admin.from("user_subscriptions").upsert({
          user_id: userId,
          plan,
          status: "active",
          billing_cycle: "monthly",
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
          razorpay_order_id: orderId,
        }, { onConflict: "user_id" });
      }
    } else if (type === "payment.failed" && orderId) {
      await admin.from("payments").update({
        status: "failed",
        razorpay_payment_id: payment?.id,
        error_description: payment?.error_description || null,
      }).eq("razorpay_order_id", orderId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
