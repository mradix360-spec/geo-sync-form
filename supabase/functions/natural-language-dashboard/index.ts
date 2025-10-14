// @ts-nocheck
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
    const { query, userId, orgId, formIds, createSingleWidget } = await req.json();
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

    // Fetch only the selected forms
    const { data: forms } = await supabase
      .from('forms')
      .select('id, title, schema')
      .in('id', formIds || []);

    // Fetch response data for each form to provide context
    const formsContext = await Promise.all((forms || []).map(async (f: any) => {
      const { data: responses, count } = await supabase
        .from('form_responses')
        .select('geojson', { count: 'exact' })
        .eq('form_id', f.id)
        .limit(5);

      const fields = f.schema?.fields?.map((field: any) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required
      })) || [];

      // Extract sample values from responses
      const sampleData: Record<string, any[]> = {};
      responses?.forEach((r: any) => {
        const props = r.geojson?.properties || {};
        Object.keys(props).forEach(key => {
          if (!sampleData[key]) sampleData[key] = [];
          if (sampleData[key].length < 3) sampleData[key].push(props[key]);
        });
      });

      return {
        id: f.id,
        title: f.title,
        responseCount: count || 0,
        fields,
        sampleData
      };
    }));

    const isCustomWidget = createSingleWidget === true;
    
    const systemPrompt = isCustomWidget 
      ? `You are an expert widget designer. Create a SINGLE, FOCUSED widget based on the user's request.

Available forms with actual data: ${JSON.stringify(formsContext, null, 2)}

CRITICAL INSTRUCTIONS:
1. Generate ONLY ONE widget that precisely matches the user's request
2. Analyze the available forms and their fields to create an appropriate visualization
3. Choose the best widget type for the requested data:
   - Text/select fields → bar_chart, pie_chart for distribution
   - Number fields → stat_card for totals/averages, line_chart for trends
   - Date fields → line_chart for time series
   - Boolean fields → pie_chart for yes/no distribution
   - Geographic data → map widget
4. Include a clear, descriptive title
5. Set appropriate position (default: { x: 0, y: 0, w: 6, h: 5 })

WIDGET CONFIG STRUCTURE (CRITICAL - FOLLOW EXACTLY):
{
  "id": "unique_id_string", // REQUIRED: Use random string like "w_abc123"
  "type": "widget_type",
  "title": "Clear, descriptive title",
  "config": {
    "formId": "actual_form_id",
    "metric": "count|field_name",
    "groupBy": "field_name|null",
    "dateField": "created_at|date_field_name",
    "timeRange": "7d|30d|90d|all",
    "aggregation": "count|sum|avg|min|max",
    "limit": 10,
    "filters": {},
    "columns": ["field1", "field2"] // for data_table
  },
  "position": { "x": 0, "y": 0, "w": 6, "h": 5 }
}

Return ONLY the widget object (not wrapped in a dashboard config).`
      : `You are an expert dashboard architect. Your goal is to create COMPREHENSIVE, INSIGHTFUL dashboards that tell a complete data story.

Available forms with actual data: ${JSON.stringify(formsContext, null, 2)}

CRITICAL INSTRUCTIONS:
1. Generate 4-8 diverse widgets that provide different perspectives on the data
2. Analyze field types to suggest appropriate visualizations:
   - Text/select fields → bar_chart, pie_chart for distribution
   - Number fields → stat_card for totals/averages, line_chart for trends
   - Date fields → line_chart for time series analysis
   - Boolean fields → pie_chart for yes/no distribution
3. Use sampleData to identify meaningful categories and create smart groupBy configurations
4. Mix widget types for visual variety and comprehensive insights
5. Position widgets in a 12-column grid layout (w: width 1-12, h: height 2-8)

WIDGET TYPES & BEST USE CASES:
- stat_card: KPIs, totals, averages (w:3-4, h:3-4)
- quick_stats: Multiple related metrics (w:6-12, h:4-6)
- bar_chart: Category comparisons, distributions (w:6, h:5-6)
- pie_chart: Proportions, percentages (w:4-6, h:5)
- line_chart: Trends over time (w:6-8, h:5-6)
- data_table: Detailed records (w:6-12, h:6-8)
- response_list: Recent activity (w:4-6, h:6)
- map: Geographic visualization (w:6-12, h:6-8)

WIDGET CONFIG STRUCTURE (CRITICAL - FOLLOW EXACTLY):
{
  "id": "unique_id_string", // REQUIRED: Use random string like "w_abc123"
  "type": "widget_type",
  "title": "Clear, descriptive title",
  "config": {
    "formId": "actual_form_id",
    "metric": "count|field_name",
    "groupBy": "field_name|null",
    "dateField": "created_at|date_field_name",
    "timeRange": "7d|30d|90d|all",
    "aggregation": "count|sum|avg|min|max",
    "limit": 10,
    "filters": {},
    "columns": ["field1", "field2"] // for data_table
  },
  "position": { "x": 0, "y": 0, "w": 6, "h": 5 }
}

LAYOUT STRATEGY:
- Row 1: Key metrics (stat_card or quick_stats)
- Row 2-3: Visual analytics (charts showing trends, distributions)
- Row 4: Detailed data (data_table or response_list)
- Use x coordinates: 0, 3, 6, 9 for proper grid alignment
- Increment y based on previous widget heights

EXAMPLE PROACTIVE DASHBOARD:
For a Water Quality form with pH, temperature, location fields:
1. Total Samples stat_card (w:3, h:3)
2. Average pH stat_card (w:3, h:3)
3. Average Temp stat_card (w:3, h:3)
4. Samples Over Time line_chart (w:9, h:5)
5. pH Distribution bar_chart (w:6, h:5)
6. Temperature by Location bar_chart (w:6, h:5)
7. Sample Locations map (w:12, h:6)
8. Recent Samples data_table (w:12, h:6)

Now generate a comprehensive dashboard with 5-8 widgets based on the user's query and available data.`;


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
        temperature: 0.7,
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

    console.log("Dashboard config generated");

    let dashboardConfig: any = null;
    let customWidgets: any[] = [];
    
    try {
      const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const candidate = fenceMatch ? fenceMatch[1] : (content.match(/\{[\s\S]*\}/)?.[0] ?? content);
      const parsed = JSON.parse(candidate);
      
      // Handle single widget creation
      if (isCustomWidget) {
        const widget = parsed.type ? parsed : parsed.widgets?.[0];
        if (!widget) {
          throw new Error("No widget generated");
        }
        
        return new Response(JSON.stringify({ 
          widgets: [widget]
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      dashboardConfig = parsed;
      
      // Extract and save custom widgets
      if (dashboardConfig.customWidgets?.length > 0) {
        customWidgets = dashboardConfig.customWidgets;
        delete dashboardConfig.customWidgets;
        
        // Save custom widgets to database
        for (const widget of customWidgets) {
          await supabase
            .from('custom_widgets')
            .insert({
              organisation_id: orgId,
              name: widget.name,
              description: widget.description,
              widget_type: widget.type,
              config: widget.config,
              created_by: userId
            });
        }
      }
    } catch {}

    if (!dashboardConfig || typeof dashboardConfig !== 'object' || !dashboardConfig.widgets?.length) {
      const firstForm = forms?.[0];
      if (!firstForm) {
        dashboardConfig = {
          title: "AI Dashboard",
          description: `Auto-generated from query: ${query}`,
          widgets: []
        };
      } else {
        // Generate a comprehensive fallback dashboard
        const generateId = () => Math.random().toString(36).substring(2, 15);
        
        const widgets: any[] = [
          {
            id: generateId(),
            type: "stat_card",
            title: "Total Submissions",
            config: { formId: firstForm.id, metric: "count", groupBy: null, dateField: "created_at", timeRange: "30d" },
            position: { x: 0, y: 0, w: 3, h: 3 }
          },
          {
            id: generateId(),
            type: "response_list",
            title: "Recent Responses",
            config: { formId: firstForm.id, limit: 5, timeRange: "7d" },
            position: { x: 3, y: 0, w: 4, h: 6 }
          },
          {
            id: generateId(),
            type: "line_chart",
            title: "Submissions Over Time",
            config: { formId: firstForm.id, metric: "count", dateField: "created_at", timeRange: "30d" },
            position: { x: 7, y: 0, w: 5, h: 5 }
          }
        ];

        // Add field-based widgets if available
        const fields = firstForm.schema?.fields || [];
        let yOffset = 6;

        const selectFields = fields.filter((f: any) => ['select', 'radio'].includes(f.type));
        if (selectFields.length > 0) {
          widgets.push({
            id: generateId(),
            type: "bar_chart",
            title: `${selectFields[0].label} Distribution`,
            config: { formId: firstForm.id, metric: "count", groupBy: selectFields[0].name, timeRange: "30d" },
            position: { x: 0, y: yOffset, w: 6, h: 5 }
          });
        }

        const numberFields = fields.filter((f: any) => f.type === 'number');
        if (numberFields.length > 0) {
          widgets.push({
            id: generateId(),
            type: "stat_card",
            title: `Average ${numberFields[0].label}`,
            config: { formId: firstForm.id, metric: numberFields[0].name, aggregation: "avg", timeRange: "30d" },
            position: { x: 6, y: yOffset, w: 3, h: 3 }
          });
        }

        widgets.push({
          id: generateId(),
          type: "data_table",
          title: "All Responses",
          config: { 
            formId: firstForm.id, 
            columns: fields.slice(0, 5).map((f: any) => f.name),
            limit: 20 
          },
          position: { x: 0, y: yOffset + 6, w: 12, h: 7 }
        });

        dashboardConfig = {
          title: "AI Dashboard",
          description: `Auto-generated from query: ${query}`,
          widgets
        };
      }
    } else {
      // Ensure all widgets have IDs
      const generateId = () => Math.random().toString(36).substring(2, 15);
      dashboardConfig.widgets = dashboardConfig.widgets.map((w: any) => ({
        ...w,
        id: w.id || generateId()
      }));
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
