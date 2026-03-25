import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, lang } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI key not configured");

    const systemPrompt = `You are a smart parser for an Indian shopkeeper's voice commands. The user speaks in Hindi or English (Hinglish). Parse their speech into a structured Khata (credit/debit) entry.

Rules:
- "diya" / "दिया" / "gave" / "udhar" / "उधार" = credit (shopkeeper gave credit to customer)
- "mila" / "मिला" / "received" / "liya" / "लिया" / "payment" = debit (customer paid back)
- Extract the person's name, amount in numbers, and determine if it's credit or debit
- If amount has "hazaar" / "हज़ार" multiply by 1000, "sau" / "सौ" = as is
- Return ONLY valid JSON, no markdown

Examples:
- "Raju ko 500 rupay diye" → {"customer_name": "Raju", "amount": 500, "entry_type": "credit", "description": "Raju ko 500 rupay diye"}
- "श्याम से 1000 रुपये मिले" → {"customer_name": "श्याम", "amount": 1000, "entry_type": "debit", "description": "श्याम से 1000 रुपये मिले"}
- "Mohan ko 2 hazaar ka saman diya" → {"customer_name": "Mohan", "amount": 2000, "entry_type": "credit", "description": "Mohan ko 2 hazaar ka saman diya"}

Return JSON with keys: customer_name, amount (number), entry_type ("credit" or "debit"), description`;

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
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Could not parse voice input" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("Parse voice entry error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
