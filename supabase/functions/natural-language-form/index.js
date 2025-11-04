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
   - Whether the form should have multiple pages for better UX

3. Field types available (ONLY USE THESE):
   - text: Short text input (names, IDs, short answers)
   - textarea: Long text input (descriptions, comments)
   - number: Numeric values (age, quantity, measurements)
   - email: Email address input
   - tel: Phone number input
   - url: Website URL input
   - date: Date picker
   - time: Time picker
   - datetime-local: Date and time picker combined
   - select: Dropdown selection (single choice from list)
   - radio: Radio buttons (single choice, visible options)
   - checkbox: Checkboxes (multiple choices allowed)
   - file: File upload (photos, documents)
   - rating: Star rating (satisfaction scores, quality ratings)
   - range: Slider for numeric range selection
   - color: Color picker

CRITICAL: NEVER use field types not in this list! NEVER create fields with empty or invalid types!

4. Geometry types (if location/map data needed):
   - Point: Single location
   - LineString: Routes, paths, boundaries
   - Polygon: Areas, zones, regions
   - null: No geographic data

IMPORTANT - POSTGIS GEOMETRY HANDLING:
⚠️ NEVER create separate latitude/longitude fields in the form!
⚠️ Geographic location is automatically handled by PostGIS geometry fields
⚠️ When users need to collect location data:
   - Set geometry_type to "Point", "LineString", or "Polygon" 
   - The system will automatically capture and store geometry data using PostGIS
   - DO NOT add fields named "latitude", "longitude", "lat", "lng", "coordinates", etc.
   - The geometry field is separate from form fields and handled by the map interface
   
Example: If user asks "create a form to collect tree locations with species name"
- Set geometry_type: "Point" (for the location)
- Add field: { name: "species_name", label: "Tree Species", type: "text" }
- DO NOT add latitude/longitude fields - PostGIS handles this automatically!

5. Multi-Page Forms:
   - For surveys with 8+ fields, create multiple pages for better UX
   - Group related fields into logical pages
   - Each page should have 3-7 fields
   - Pages flow logically through the data collection process
   - Example: Page 1 (Basic Info) → Page 2 (Details) → Page 3 (Additional)

6. Field naming conventions:
   - Use snake_case for field names (e.g., "water_quality", "sample_date")
   - Make names descriptive but concise
   - Avoid spaces and special characters

7. Sections within pages:
   - Each page can have multiple sections to organize fields
   - Sections help group related fields together
   - Section titles should be clear and descriptive

FORM SCHEMA STRUCTURE (CRITICAL - FOLLOW EXACTLY):
{
  "title": "Clear form title",
  "description": "Brief description of the form's purpose",
  "geometry_type": "Point|LineString|Polygon|null",
  "multiPage": true|false,
  "totalPages": 1|2|3|etc,
  "sections": [
    {
      "id": "section_1",
      "title": "Section Title",
      "description": "Optional section description",
      "collapsible": false,
      "pageNumber": 1
    }
  ],
  "fields": [
    {
      "name": "field_name_snake_case",
      "label": "User-friendly field label",
      "type": "text|textarea|number|email|tel|url|date|time|datetime-local|select|radio|checkbox|file|rating|range|color",
      "required": true|false,
      "placeholder": "Optional placeholder text",
      "options": ["option1", "option2"], // Only for select, radio, checkbox
      "sectionId": "section_1"
    }
  ]
}

BEST PRACTICES:
- Include 5-15 fields depending on complexity
- For 8+ fields, use multiple pages (typically 2-3 pages)
- Mark critical fields as required
- Provide helpful placeholder text
- For select/radio/checkbox, include realistic options
- Group related fields in the same section/page
- Consider the data collection workflow

MULTI-PAGE EXAMPLE:

User: "Create a comprehensive customer satisfaction survey"
Response:
{
  "title": "Customer Satisfaction Survey",
  "description": "We value your feedback! Help us improve by sharing your experience.",
  "geometry_type": null,
  "multiPage": true,
  "totalPages": 3,
  "sections": [
    {
      "id": "section_1",
      "title": "About Your Visit",
      "collapsible": false,
      "pageNumber": 1
    },
    {
      "id": "section_2",
      "title": "Service Quality",
      "collapsible": false,
      "pageNumber": 2
    },
    {
      "id": "section_3",
      "title": "Additional Feedback",
      "collapsible": false,
      "pageNumber": 3
    }
  ],
  "fields": [
    {
      "name": "visit_date",
      "label": "Date of Visit",
      "type": "date",
      "required": true,
      "sectionId": "section_1"
    },
    {
      "name": "service_type",
      "label": "What service did you use?",
      "type": "select",
      "required": true,
      "options": ["In-Store", "Online", "Phone Support", "Other"],
      "sectionId": "section_1"
    },
    {
      "name": "overall_satisfaction",
      "label": "Overall Satisfaction",
      "type": "radio",
      "required": true,
      "options": ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"],
      "sectionId": "section_2"
    },
    {
      "name": "staff_helpful",
      "label": "Staff Helpfulness",
      "type": "radio",
      "required": true,
      "options": ["Poor", "Fair", "Good", "Excellent"],
      "sectionId": "section_2"
    },
    {
      "name": "would_recommend",
      "label": "Would you recommend us?",
      "type": "radio",
      "required": true,
      "options": ["Yes", "No", "Maybe"],
      "sectionId": "section_3"
    },
    {
      "name": "comments",
      "label": "Additional Comments",
      "type": "textarea",
      "required": false,
      "placeholder": "Share any additional thoughts...",
      "sectionId": "section_3"
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

    // Process sections
    let sections = formSchema.sections;
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      sections = [{
        id: 'section_1',
        title: 'Basic Information',
        collapsible: false,
        pageNumber: 1
      }];
    }

    // Validate field types
    const validTypes = [
      'text', 'textarea', 'number', 'email', 'tel', 'url', 
      'date', 'time', 'datetime-local', 'select', 'radio', 
      'checkbox', 'file', 'rating', 'range', 'color'
    ];

    // Ensure all fields have valid types and sectionId
    const firstSectionId = sections[0]?.id || 'section_1';
    formSchema.fields = formSchema.fields
      .filter((field: any) => field && field.name) // Remove fields without names
      .map((field: any) => {
        // Validate and fix field type
        let fieldType = field.type || 'text';
        if (!validTypes.includes(fieldType)) {
          console.warn(`Invalid field type "${fieldType}" for field "${field.name}", defaulting to "text"`);
          fieldType = 'text';
        }

        // Ensure options exist for choice-based fields
        if (['select', 'radio', 'checkbox'].includes(fieldType) && (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
          console.warn(`Field "${field.name}" of type "${fieldType}" missing options, defaulting to text`);
          fieldType = 'text';
        }

        return {
          name: field.name,
          label: field.label || field.name || 'Unnamed Field',
          type: fieldType,
          required: field.required === true,
          placeholder: field.placeholder || '',
          options: (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') ? field.options : undefined,
          sectionId: field.sectionId || firstSectionId,
        };
      });

    // Include sections and multi-page settings in response
    const responseSchema = {
      title: formSchema.title,
      description: formSchema.description,
      geometry_type: formSchema.geometry_type,
      multiPage: formSchema.multiPage || false,
      totalPages: formSchema.totalPages || 1,
      sections: sections,
      fields: formSchema.fields,
    };

    return new Response(JSON.stringify(responseSchema), {
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
