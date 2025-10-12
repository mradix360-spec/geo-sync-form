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
    const { prompt, userId, orgId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Processing natural language form creation:", prompt);

    const systemPrompt = `You are an expert survey and form designer. Create a comprehensive, well-structured form based on the user's description.

CRITICAL INSTRUCTIONS:
1. Generate a complete form with title, description, and fields
2. Analyze the user's request to determine:
   - What type of data they want to collect
   - Whether geographic data is needed (geometry_type)
   - What fields are required vs optional
   - Appropriate field types for each piece of information

3. Field types available:
   - text: Short text input (names, IDs, short answers)
   - textarea: Long text input (descriptions, comments)
   - number: Numeric values (age, quantity, measurements)
   - select: Dropdown selection (single choice)
   - radio: Radio buttons (single choice)
   - checkbox: Checkboxes (multiple choices)
   - date: Date picker
   - time: Time picker
   - file: File upload (photos, documents)

4. Geometry types (if location/map data needed):
   - Point: Single location
   - LineString: Routes, paths, boundaries
   - Polygon: Areas, zones, regions
   - null: No geographic data

5. Field naming conventions:
   - Use snake_case for field names (e.g., "water_quality", "sample_date")
   - Make names descriptive but concise
   - Avoid spaces and special characters

FORM SCHEMA STRUCTURE (CRITICAL - FOLLOW EXACTLY):
{
  "title": "Clear form title",
  "description": "Brief description of the form's purpose",
  "geometry_type": "Point|LineString|Polygon|null",
  "fields": [
    {
      "name": "field_name_snake_case",
      "label": "User-friendly field label",
      "type": "text|textarea|number|select|radio|checkbox|date|time|file",
      "required": true|false,
      "placeholder": "Optional placeholder text",
      "options": ["option1", "option2"] // Only for select, radio, checkbox
    }
  ]
}

BEST PRACTICES:
- Include 5-15 fields depending on complexity
- Mark critical fields as required
- Provide helpful placeholder text
- For select/radio/checkbox, include realistic options
- Add validation-friendly field names
- Consider the data collection workflow

EXAMPLES:

User: "Create a water quality survey"
Response:
{
  "title": "Water Quality Assessment Form",
  "description": "Collect water quality data including pH, temperature, and contamination levels",
  "geometry_type": "Point",
  "fields": [
    {
      "name": "sample_id",
      "label": "Sample ID",
      "type": "text",
      "required": true,
      "placeholder": "e.g., WQ-2024-001"
    },
    {
      "name": "sample_date",
      "label": "Sample Date",
      "type": "date",
      "required": true
    },
    {
      "name": "sample_time",
      "label": "Sample Time",
      "type": "time",
      "required": true
    },
    {
      "name": "water_source",
      "label": "Water Source",
      "type": "select",
      "required": true,
      "options": ["River", "Lake", "Well", "Tap Water", "Other"]
    },
    {
      "name": "ph_level",
      "label": "pH Level",
      "type": "number",
      "required": true,
      "placeholder": "0-14"
    },
    {
      "name": "temperature",
      "label": "Temperature (°C)",
      "type": "number",
      "required": true
    },
    {
      "name": "turbidity",
      "label": "Turbidity",
      "type": "select",
      "required": true,
      "options": ["Clear", "Slightly Cloudy", "Cloudy", "Very Cloudy"]
    },
    {
      "name": "contamination_visible",
      "label": "Visible Contamination",
      "type": "radio",
      "required": true,
      "options": ["Yes", "No"]
    },
    {
      "name": "contamination_types",
      "label": "Types of Contamination",
      "type": "checkbox",
      "required": false,
      "options": ["Oil/Grease", "Algae", "Debris", "Foam", "Discoloration", "Other"]
    },
    {
      "name": "sample_photo",
      "label": "Sample Photo",
      "type": "file",
      "required": false
    },
    {
      "name": "notes",
      "label": "Additional Notes",
      "type": "textarea",
      "required": false,
      "placeholder": "Any observations or additional information"
    }
  ]
}

Now create a comprehensive form based on the user's request.`;

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
          { role: "user", content: prompt }
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

    console.log("Form schema generated");

    let formSchema: any = null;
    
    try {
      const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const candidate = fenceMatch ? fenceMatch[1] : (content.match(/\{[\s\S]*\}/)?.[0] ?? content);
      formSchema = JSON.parse(candidate);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse form schema from AI response");
    }

    // Validate the schema
    if (!formSchema || !formSchema.title || !formSchema.fields || !Array.isArray(formSchema.fields)) {
      throw new Error("Invalid form schema generated");
    }

    // Ensure all required field properties exist
    formSchema.fields = formSchema.fields.map((field: any) => ({
      name: field.name || 'unnamed_field',
      label: field.label || field.name || 'Unnamed Field',
      type: field.type || 'text',
      required: field.required === true,
      placeholder: field.placeholder || '',
      options: field.options || undefined,
    }));

    return new Response(JSON.stringify(formSchema), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in natural-language-form:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
