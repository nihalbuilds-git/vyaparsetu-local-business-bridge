import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { businessName, offer, platform, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI key not configured");

    const systemPrompt = `You are a marketing expert for small Indian businesses. Generate a compelling, ready-to-use marketing campaign message. 
Rules:
- Write in ${language}
- Optimize for ${platform} (use appropriate formatting, emojis, length)
- For WhatsApp: keep under 500 chars with emojis
- For Instagram: include hashtags  
- For SMS: keep under 160 chars
- For Poster: include a catchy headline and body text
- Make it culturally relevant for Indian local businesses
- Include a call to action`;

    const userPrompt = `Business: ${businessName}\nOffer: ${offer}\nPlatform: ${platform}\nLanguage: ${language}\n\nGenerate the campaign message:`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const campaign = data.choices?.[0]?.message?.content || "Could not generate campaign.";

    return new Response(JSON.stringify({ campaign }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Campaign generation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
