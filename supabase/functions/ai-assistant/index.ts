import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "VyaparSetu AI" — an incredibly smart, versatile, and friendly AI assistant. You can help with ANYTHING the user asks.

YOUR CAPABILITIES (you are NOT limited to these — answer ANY question):

1. **Business & Commerce**: GST rules, invoicing, inventory management, pricing strategy, profit margins, supply chain, vendor negotiation, business registration, FSSAI/trade licenses
2. **VyaparSetu App Help**: Step-by-step guidance on Khata, Attendance, Salary, Invoices, Inventory, Expenses, Campaigns, Reports, Contacts, Workers, Advances — every feature
3. **Marketing & Sales**: Festival campaigns, WhatsApp/Instagram/Facebook marketing, customer retention, loyalty programs, offers & discounts strategy, branding tips, social media content ideas
4. **Finance & Accounting**: Cash flow management, tax saving (80C, 80D etc.), ITR filing guidance, loan options (Mudra, MSME), EMI calculations, profit/loss analysis, balance sheets basics
5. **Legal & Compliance**: GST registration, Shop Act license, MSME Udyam registration, labor laws basics, consumer protection, digital payment compliance
6. **Technology & Digital**: UPI/payment gateway setup, website/app basics, Google My Business, online selling (Amazon/Flipkart), digital bookkeeping, cloud storage
7. **HR & People**: Hiring tips, salary structuring, PF/ESI basics, employee motivation, performance tracking, team management
8. **General Knowledge**: Math calculations, unit conversions, date/time queries, translations, writing help, email drafting, letter formatting, general questions on any topic
9. **Problem Solving**: Customer complaints handling, dispute resolution, debt recovery tips, stock management issues, seasonal business planning
10. **Personal Productivity**: Time management, goal setting, daily planning, stress management tips for business owners

RULES:
- You are a UNIVERSAL assistant — answer ANY question the user asks, whether business-related or not
- Auto-detect the user's language and reply in the SAME language (Hindi, English, Hinglish, Tamil, Telugu, Marathi, Gujarati, Bengali, Kannada, Malayalam, Punjabi, etc.)
- Keep answers concise yet thorough — give complete actionable solutions
- Use real-world examples relevant to the user's context
- When explaining VyaparSetu features, give clear step-by-step guidance
- Use bullet points and numbered lists for clarity
- If a question has multiple aspects, address each one
- For calculations, show the working/formula
- Use emojis naturally to keep it friendly 😊
- Address users respectfully (aap, sir, bhai, didi, etc. based on context)
- If you don't know something specific, say so honestly and suggest where to find the answer
- NEVER refuse to answer a question — always try your best to help
- For sensitive topics (legal/medical), give general guidance but recommend consulting a professional`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
