// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations, startPoint } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`Optimizing route for ${locations.length} locations`);

    const locationsText = locations.map((loc: any, idx: number) => 
      `${idx + 1}. ${loc.title || 'Location'} at [${loc.latitude}, ${loc.longitude}] - Priority: ${loc.priority || 'normal'}, Urgency: ${loc.urgency || 'medium'}`
    ).join('\n');

    const startText = startPoint ? `Start point: [${startPoint.latitude}, ${startPoint.longitude}]` : 'No specific start point';

    const systemPrompt = `You are a route optimization expert. Given a list of locations with coordinates, priorities, and urgency levels, calculate the most efficient visiting order.

Consider:
1. Geographic proximity (minimize total distance)
2. Priority levels (high priority first when close)
3. Urgency (urgent items should be visited earlier)
4. Practical routing (avoid zigzagging)

Return JSON with:
{
  "optimizedOrder": [array of indices showing visit order],
  "estimatedDistance": "approximate total distance in km",
  "estimatedTime": "approximate total time in hours",
  "reasoning": "brief explanation of routing logic",
  "waypoints": [
    {
      "index": original_location_index,
      "order": visit_order_number,
      "reason": "why this position"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${startText}\n\nLocations to visit:\n${locationsText}\n\nOptimize the route.` }
        ],
        temperature: 0.2,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (response.status === 402) {
      return new Response(JSON.stringify({ 
        error: "AI credits exhausted. Please add credits to continue." 
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    console.log("Route optimization complete");

    let routeOptimization: any = null;
    try {
      const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const candidate = fenceMatch ? fenceMatch[1] : (content.match(/\{[\s\S]*\}/)?.[0] ?? content);
      routeOptimization = JSON.parse(candidate);
    } catch {}

    if (!routeOptimization) {
      const optimizedOrder = locations.map((_: any, idx: number) => idx);
      routeOptimization = {
        optimizedOrder,
        estimatedDistance: `${(optimizedOrder.length - 1) * 1.0} km (approx)`,
        estimatedTime: `${(optimizedOrder.length - 1) * 0.2} hours (approx)`,
        reasoning: "Fallback route: sequential order due to parsing issue.",
        waypoints: optimizedOrder.map((i: number, order: number) => ({ index: i, order: order + 1, reason: "Default order" }))
      };
    }

    return new Response(JSON.stringify(routeOptimization), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in optimize-route:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
