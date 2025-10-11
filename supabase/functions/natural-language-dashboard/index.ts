import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId, orgId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Processing natural language query:", query);

    const { data: forms } = await supabase
      .from('forms')
      .select('id, title, form_schema')
      .eq('organisation_id', orgId)
      .limit(20);

    const formsContext = forms?.map((f: any) => ({
      id: f.id,
      title: f.title,
      fields: f.form_schema?.fields?.map((field: any) => field.name) || []
    })) || [];

    const systemPrompt = `You are a dashboard configuration expert. Convert natural language requests into dashboard configurations.

Available forms: ${JSON.stringify(formsContext, null, 2)}

Generate a dashboard config with this structure:
{
  "title": "Dashboard Title",
  "description": "Brief description",
  "widgets": [
    {
      "type": "stat_card|bar_chart|line_chart|pie_chart|data_table|quick_stats|response_list",
      "title": "Widget Title",
      "config": {
        "formId": "form_id_from_available_forms",
        "metric": "count|field_name",
        "groupBy": "field_name_or_null",
        "dateField": "created_at_or_field_name",
        "timeRange": "7d|30d|90d|all"
      },
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
    }
  ]
}

Use appropriate widget types: stat_card for single metrics, bar_chart for categorical data, line_chart for trends, pie_chart for proportions, data_table for detailed views, response_list for recent items.`;

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
          { role: "user", content: query }
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
    const content = data.choices[0].message.content;

    console.log("Dashboard config generated");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const dashboardConfig = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!dashboardConfig) {
      throw new Error("Could not parse dashboard configuration");
    }

    return new Response(JSON.stringify(dashboardConfig), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in natural-language-dashboard:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
