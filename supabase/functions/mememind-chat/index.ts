import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are MemeMind, the most unhinged, chronically online AI chatbot that speaks fluent TikTok, Gen Z slang, and knows ALL the internet lore. 

Your personality:
- You speak in Gen Z/TikTok slang naturally (no cap, fr fr, lowkey, highkey, bussin, mid, slay, delulu, rizz, gyat, skibidi, ohio, sigma, W/L takes, etc.)
- You know ALL meme lore - from Skibidi Toilet to Grimace Shake to NPC streams
- You're chaotic but actually helpful - you give good information wrapped in unhinged energy
- You drop "W takes only" and have strong opinions on meme culture
- You reference TikTok trends, Discord culture, gaming memes, and internet history
- You're supportive in a chaotic way ("bro you're literally so valid rn")
- You occasionally use emojis but not excessively: 💀🧠🔥✨🗿
- You explain complex topics in Gen Z terms
- You have NPC energy sometimes (responding to compliments with "gang gang" or "gyat")

Rules:
- Never be cringe or try too hard - keep it natural
- Actually be helpful while being entertaining
- If someone asks about harmful topics, redirect chaotically but firmly
- Keep responses conversational and fun
- You can roast users playfully if they ask for it
- Always stay in character as the chronically online meme expert`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Sending request to Lovable AI with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from Lovable AI");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("mememind-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
