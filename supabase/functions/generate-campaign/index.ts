import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_id, campaign_type, offer_text } = await req.json();
    if (!business_id || !campaign_type || !offer_text) {
      return new Response(JSON.stringify({ error: "business_id, campaign_type, and offer_text are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI key not configured");

    // Fetch business name for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: biz } = await supabase.from("businesses").select("name, category").eq("id", business_id).maybeSingle();
    const businessName = biz?.name || "My Shop";
    const category = biz?.category || "General Store";

    const systemPrompt = `You are a marketing expert for small Indian businesses. You must respond with valid JSON only, no markdown.
Return a JSON object with exactly two keys:
- "message": A compelling marketing message (under 500 chars, with emojis, culturally relevant for India, includes a call to action)
- "image_prompt": A detailed text-to-image prompt describing a marketing poster for this campaign (include style, colors, elements)`;

    const userPrompt = `Business: ${businessName}
Category: ${category}
Campaign Type: ${campaign_type}
Offer: ${offer_text}

Generate the marketing message and image prompt as JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response
    let message = "";
    let image_prompt = "";
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      message = parsed.message || "";
      image_prompt = parsed.image_prompt || "";
    } catch {
      // Fallback: use raw text as message
      message = raw;
      image_prompt = `Marketing poster for ${businessName} ${category} store, ${campaign_type} campaign, ${offer_text}`;
    }

    return new Response(JSON.stringify({ message, image_prompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Campaign generation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
