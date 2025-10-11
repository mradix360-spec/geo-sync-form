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
    const { formId, responseData, responseId } = await req.json();
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

    console.log("Detecting anomalies for form:", formId);

    const { data: recentResponses } = await supabase
      .from('form_responses')
      .select('response_data, geometry, created_at')
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: form } = await supabase
      .from('forms')
      .select('form_schema, title')
      .eq('id', formId)
      .single();

    const systemPrompt = `You are an anomaly detection expert for field data collection. Analyze this submission against historical patterns.

Form: ${form?.title || 'Unknown'}
Fields: ${JSON.stringify(form?.form_schema?.fields?.map((f: any) => ({ name: f.name, type: f.type })) || [])}

Historical pattern summary:
- Total responses: ${recentResponses?.length || 0}
- Sample data points: ${JSON.stringify(recentResponses?.slice(0, 5).map((r: any) => r.response_data) || [])}

Check for:
1. Duplicate locations (same coordinates as recent submissions)
2. Impossible values (out of realistic ranges)
3. Suspicious patterns (repeated identical answers)
4. Missing critical data
5. Geographic outliers (far from usual collection area)
6. Time anomalies (submission at unusual hours)

Return JSON:
{
  "isAnomaly": true or false,
  "severity": "low" or "medium" or "high",
  "flags": [
    {
      "type": "duplicate_location|impossible_value|suspicious_pattern|missing_data|geographic_outlier|time_anomaly",
      "field": "field_name_or_general",
      "description": "what is wrong",
      "confidence": 0.8
    }
  ],
  "recommendation": "what to do about it"
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
          { 
            role: "user", 
            content: `Analyze this submission:\n${JSON.stringify(responseData, null, 2)}\n\nSubmission ID: ${responseId}` 
          }
        ],
        temperature: 0.1,
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

    console.log("Anomaly detection complete");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const anomalyReport = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      isAnomaly: false,
      severity: "low",
      flags: [],
      recommendation: "No anomalies detected"
    };

    return new Response(JSON.stringify(anomalyReport), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in detect-anomalies:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
