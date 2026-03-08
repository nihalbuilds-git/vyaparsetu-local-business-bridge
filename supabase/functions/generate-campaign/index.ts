import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_id, campaign_type, offer_text, poster_only, existing_message, existing_image_prompt } = await req.json();
    if (!business_id || !campaign_type || !offer_text) {
      return new Response(JSON.stringify({ error: "business_id, campaign_type, and offer_text are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI key not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: biz } = await supabase.from("businesses").select("name, category").eq("id", business_id).maybeSingle();
    const businessName = biz?.name || "My Shop";
    const category = biz?.category || "General Store";

    let message = "";
    let image_prompt = "";

    if (poster_only && existing_message) {
      // Skip text generation, reuse existing message & prompt
      message = existing_message;
      image_prompt = existing_image_prompt || `Marketing poster for ${businessName} ${category} store, ${campaign_type} campaign, ${offer_text}`;
    } else {
      // Step 1: Generate marketing message + image prompt
      const systemPrompt = `You are a marketing expert for small Indian businesses. You must respond with valid JSON only, no markdown.
Return a JSON object with exactly two keys:
- "message": A compelling marketing message (under 500 chars, with emojis, culturally relevant for India, includes a call to action)
- "image_prompt": A detailed text-to-image prompt describing a marketing poster for this campaign (include style, colors, elements, text to show on poster)`;

      const userPrompt = `Business: ${businessName}
Category: ${category}
Campaign Type: ${campaign_type}
Offer: ${offer_text}

Generate the marketing message and image prompt as JSON.`;

      const textResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

      if (!textResponse.ok) {
        const status = textResponse.status;
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
        const text = await textResponse.text();
        console.error("AI gateway error:", status, text);
        throw new Error("AI gateway error");
      }

      const data = await textResponse.json();
      const raw = data.choices?.[0]?.message?.content || "";

      try {
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        message = parsed.message || "";
        image_prompt = parsed.image_prompt || "";
      } catch {
        message = raw;
        image_prompt = `Marketing poster for ${businessName} ${category} store, ${campaign_type} campaign, ${offer_text}`;
      }
    }

    // Step 2: Generate poster image
    let poster_url: string | null = null;
    try {
      const imagePromptText = `Create a professional, vibrant marketing poster for an Indian ${category} shop called "${businessName}". 
Campaign type: ${campaign_type}. 
Offer: ${offer_text}.
Style: Bold colors, festive Indian design, clear text showing the offer, eye-catching layout suitable for WhatsApp sharing. 
${image_prompt}`;

      console.log("Generating poster image...");
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "user", content: imagePromptText },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl && imageUrl.startsWith("data:image/")) {
          // Extract base64 data and upload to storage
          const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (base64Match) {
            const ext = base64Match[1]; // png, jpeg, etc.
            const base64Data = base64Match[2];
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            const fileName = `${business_id}/${crypto.randomUUID()}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from("campaign-posters")
              .upload(fileName, binaryData, {
                contentType: `image/${ext}`,
                upsert: false,
              });

            if (uploadError) {
              console.error("Upload error:", uploadError.message);
            } else {
              const { data: urlData } = supabase.storage
                .from("campaign-posters")
                .getPublicUrl(fileName);
              poster_url = urlData.publicUrl;
              console.log("Poster uploaded:", poster_url);
            }
          }
        }
      } else {
        const errStatus = imageResponse.status;
        const errText = await imageResponse.text();
        console.error("Image generation error:", errStatus, errText);
      }
    } catch (imgErr) {
      console.error("Image generation failed:", imgErr);
      // Don't fail the whole request if image gen fails
    }

    // Step 3: Save campaign
    await supabase.from("campaigns").insert({
      business_id,
      message,
      poster_url,
    });

    return new Response(JSON.stringify({ message, image_prompt, poster_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Campaign generation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
