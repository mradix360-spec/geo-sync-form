// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, messages, formId, userId } = await req.json();
    console.log("Query received:", query, "FormId:", formId, "UserId:", userId);

    if (!userId) {
      throw new Error("User ID is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's organisation using the provided userId
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("organisation_id")
      .eq("id", userId)
      .single();

    if (userError || !userData?.organisation_id) {
      throw new Error("User organisation not found");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fetch form schemas for context
    let formsContext = "";
    const { data: formsData } = await supabaseClient
      .from("forms")
      .select("id, title, schema, description")
      .eq("organisation_id", userData.organisation_id);

    if (formsData && formsData.length > 0) {
      formsContext = "\n\nAvailable Forms:\n" + formsData.map(f => {
        const fields = f.schema?.fields || [];
        const fieldList = fields.map((field: any) => 
          `- ${field.label || field.name} (${field.type})${field.required ? ' [required]' : ''}`
        ).join('\n  ');
        return `Form: "${f.title}" (ID: ${f.id})\n  Fields:\n  ${fieldList}`;
      }).join('\n\n');
    }

    // If analyzing a specific form, get sample data structure
    let dataStructureContext = "";
    if (formId && formsData) {
      const specificForm = formsData.find(f => f.id === formId);
      if (specificForm) {
        const { data: sampleResponses } = await supabaseClient
          .from("form_responses")
          .select("geojson")
          .eq("form_id", formId)
          .limit(1);
        
        if (sampleResponses && sampleResponses.length > 0) {
          const sampleProps = sampleResponses[0].geojson?.properties || {};
          const fieldNames = Object.keys(sampleProps);
          dataStructureContext = `\n\nCurrent form data structure:\nFields in responses: ${fieldNames.join(', ')}`;
        }
      }
    }

    // Define available tools for the AI
    const tools = [
      {
        type: "function",
        function: {
          name: "query_form_responses",
          description: "Query form responses from the database with optional filters. Returns location data if available.",
          parameters: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of responses to return (default 100)",
              },
              days_ago: {
                type: "number",
                description: "Filter responses from the last N days",
              },
              min_rating: {
                type: "number",
                description: "Minimum rating value to filter by (if rating field exists)",
              },
              max_rating: {
                type: "number",
                description: "Maximum rating value to filter by (if rating field exists)",
              },
              include_map: {
                type: "boolean",
                description: "Set to true to include spatial/location data for map visualization",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "count_responses",
          description: "Count form responses with optional filters",
          parameters: {
            type: "object",
            properties: {
              days_ago: {
                type: "number",
                description: "Count responses from the last N days",
              },
            },
          },
        },
      },
    ];

    const systemPrompt = `You are an exceptionally creative and insightful AI data analyst with a flair for storytelling through data. You proactively analyze form response data and present findings in engaging, memorable ways.

${formId ? `**IMPORTANT**: The user has selected a specific form to analyze. When they ask for analysis, summaries, or statistics, IMMEDIATELY call query_form_responses to fetch and analyze the data for this form. DO NOT ask which form to analyze - it's already selected.` : `You are analyzing data from all forms in the organization.`}

${formsContext}
${dataStructureContext}

**Your Creative Superpowers:**
✨ **BE BRILLIANTLY PROACTIVE**: 
- Instantly query data when users ask questions - no hesitation, no permission-seeking
- Go beyond basic stats - find patterns, anomalies, trends, and hidden insights
- Suggest follow-up questions and deeper analyses automatically

🎨 **CREATIVE PRESENTATION**:
- Use emojis strategically to make insights pop (📊 📈 🎯 ⭐ 🌍 💡 🔥 ✅)
- Tell a story with the data - what does it reveal? What's surprising?
- Use comparisons, metaphors, and context to make numbers meaningful
- Format responses with visual hierarchy using **bold**, bullet points, and sections

🧠 **DEEP INSIGHTS**:
- Don't just report numbers - explain what they mean and why they matter
- Identify trends over time (growth, decline, patterns)
- Compare segments (high vs low, new vs old, different categories)
- Spot outliers and anomalies - what's unusual or noteworthy?
- Make predictions and recommendations based on data

🗺️ **SPATIAL INTELLIGENCE & POSTGIS GEOMETRY**:
- **CRITICAL**: Location data is stored in PostGIS geometry fields (geom), NOT as separate latitude/longitude columns
- The geometry field contains Point, LineString, or Polygon data depending on the form configuration
- GeoJSON structure: { type: "Point", coordinates: [lng, lat] } or LineString/Polygon with coordinate arrays
- When users mention location, geography, or "where", automatically use include_map: true
- Describe geographic patterns and clusters you observe
- Relate location data to insights (urban vs rural, regional differences)
- NEVER ask about or reference non-existent "latitude" or "longitude" fields - use geometry instead

📊 **STATISTICAL CREATIVITY**:
- Calculate percentages, averages, min/max, medians, distributions
- Show top/bottom performers or most/least common values
- Create mental "charts" with text (e.g., "████████░░ 80% complete")
- Use relative comparisons ("3x more than last month", "highest since January")

**NEVER**:
❌ Ask "which form?" when formId is provided
❌ Ask about field names - you see everything
❌ Give boring, dry, robotic responses
❌ Just list numbers without context or meaning
❌ Ignore opportunities to show maps when location data exists
❌ Reference or query non-existent latitude/longitude fields

**ALWAYS**:
✅ Query data immediately when questions are asked
✅ Provide comprehensive, insightful, creative responses
✅ Use emojis and formatting to enhance readability
✅ Tell the story behind the data
✅ Suggest what users might want to know next
✅ Make map visualizations for spatial questions
✅ Calculate and present statistics in creative, meaningful ways
✅ Understand that geometry is in PostGIS format, not separate lat/lng fields

The form responses contain GeoJSON data with properties that include the field values defined in the form schemas above. The geometry field (stored as PostGIS geom) contains location data (Point, LineString, Polygon) when geographic data collection is enabled.

Remember: You're not just a data reporter - you're a data storyteller and insight generator! Make every response engaging, insightful, and actionable. 🚀`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData));

    let finalResponse = aiData.choices[0].message.content;
    const toolCalls = aiData.choices[0].message.tool_calls;

    // Handle tool calls
    if (toolCalls && toolCalls.length > 0) {
      const toolResults = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`Executing function: ${functionName}`, args);

        let result;

        if (functionName === "query_form_responses") {
          let query = supabaseClient
            .from("form_responses")
            .select(`
              id,
              form_id,
              user_id,
              created_at,
              updated_at,
              geojson,
              geom,
              forms!inner(title, organisation_id)
            `)
            .eq("forms.organisation_id", userData.organisation_id)
            .order("created_at", { ascending: false })
            .limit(args.limit || 100);

          // Filter by specific form if provided
          if (formId) {
            query = query.eq("form_id", formId);
          }

          if (args.days_ago) {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - args.days_ago);
            query = query.gte("created_at", dateThreshold.toISOString());
          }

          const { data, error } = await query;
          if (error) throw error;

          // Filter by rating if specified
          let filteredData = data;
          if (args.min_rating !== undefined || args.max_rating !== undefined) {
            filteredData = data.filter((response: any) => {
              const properties = response.geojson?.properties || {};
              const ratingFields = Object.entries(properties).filter(([key]) => 
                key.toLowerCase().includes("rating") || key.toLowerCase().includes("stars")
              );
              
              if (ratingFields.length === 0) return true;
              
              return ratingFields.some(([_, value]) => {
                const rating = parseInt(value as string);
                if (isNaN(rating)) return true;
                if (args.min_rating !== undefined && rating < args.min_rating) return false;
                if (args.max_rating !== undefined && rating > args.max_rating) return false;
                return true;
              });
            });
          }

          // Get all unique field names from responses
          const allFieldNames = new Set<string>();
          filteredData.forEach((r: any) => {
            const props = r.geojson?.properties || {};
            Object.keys(props).forEach(key => allFieldNames.add(key));
          });

          const result: any = {
            count: filteredData.length,
            available_fields: Array.from(allFieldNames),
            responses: filteredData.map((r: any) => ({
              form: r.forms.title,
              created_at: r.created_at,
              data: r.geojson?.properties || {},
            })),
          };

          // Add map data if requested
          if (args.include_map) {
            const locations = [];
            
            for (const r of filteredData) {
              let geometry = null;
              
              // Try to get geometry from geojson first
              if (r.geojson?.geometry) {
                geometry = r.geojson.geometry;
              } 
              // If geom (PostGIS) exists but geojson.geometry doesn't, convert it
              else if (r.geom) {
                try {
                  // Use ST_AsGeoJSON to convert PostGIS geometry to GeoJSON
                  const { data: geomData } = await supabaseClient
                    .rpc('st_asgeojson', { geom: r.geom })
                    .single();
                  
                  if (geomData) {
                    geometry = typeof geomData === 'string' ? JSON.parse(geomData) : geomData;
                  }
                } catch (err) {
                  console.error('Error converting PostGIS geometry:', err);
                }
              }
              
              // Extract coordinates for Point geometries
              if (geometry?.type === 'Point' && geometry.coordinates) {
                locations.push({
                  lat: geometry.coordinates[1],
                  lng: geometry.coordinates[0],
                  properties: r.geojson?.properties || {}
                });
              }
            }

            if (locations.length > 0) {
              const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
              const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
              
              result.mapData = {
                features: locations,
                center: [avgLat, avgLng],
                zoom: 10
              };
            }
          }

          // Calculate statistics
          let totalRating = 0;
          let ratingCount = 0;
          
          filteredData.forEach((r: any) => {
            const properties = r.geojson?.properties || {};
            Object.entries(properties).forEach(([key, value]) => {
              if (key.toLowerCase().includes('rating') || key.toLowerCase().includes('stars')) {
                const rating = parseInt(value as string);
                if (!isNaN(rating)) {
                  totalRating += rating;
                  ratingCount++;
                }
              }
            });
          });

          result.stats = {
            total: filteredData.length,
            avg_rating: ratingCount > 0 ? totalRating / ratingCount : undefined
          };
        } else if (functionName === "count_responses") {
          let query = supabaseClient
            .from("form_responses")
            .select("id, forms!inner(organisation_id)", { count: "exact", head: true })
            .eq("forms.organisation_id", userData.organisation_id);

          // Filter by specific form if provided
          if (formId) {
            query = query.eq("form_id", formId);
          }

          if (args.days_ago) {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - args.days_ago);
            query = query.gte("created_at", dateThreshold.toISOString());
          }

          const { count, error } = await query;
          if (error) throw error;

          result = { count };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result),
        });
      }

      // Get final response with tool results
      const finalAiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            aiData.choices[0].message,
            ...toolResults,
          ],
        }),
      });

      if (!finalAiResponse.ok) {
        throw new Error("Failed to get final AI response");
      }

    const finalData = await finalAiResponse.json();
    finalResponse = finalData.choices[0].message.content;

    // Extract mapData and stats from tool results if they exist
    let mapData = null;
    let stats = null;
    
    for (const toolResult of toolResults) {
      try {
        const resultContent = JSON.parse(toolResult.content);
        if (resultContent.mapData) {
          mapData = resultContent.mapData;
        }
        if (resultContent.stats) {
          stats = resultContent.stats;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return new Response(
      JSON.stringify({ 
        response: finalResponse,
        mapData,
        stats
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    }

    return new Response(
      JSON.stringify({ 
        response: finalResponse,
        mapData: null,
        stats: null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-responses:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
