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
    const { query, messages, formId } = await req.json();
    console.log("Query received:", query, "FormId:", formId);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get user's organisation
    const { data: userData } = await supabaseClient
      .from("users")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organisation_id) {
      throw new Error("User organisation not found");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Define available tools for the AI
    const tools = [
      {
        type: "function",
        function: {
          name: "query_form_responses",
          description: "Query form responses from the database with optional filters",
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

    const systemPrompt = `You are an AI assistant that helps analyze form response data. You have access to functions to query and count form responses.
${formId ? `You are currently analyzing data from a specific form.` : `You are analyzing data from all forms in the organization.`}

When analyzing data:
- Be specific and provide clear insights
- Use appropriate filters based on the user's question
- Format numbers and dates clearly
- Highlight key findings and trends
- Suggest follow-up questions when relevant
- If looking at specific form data, focus on that form's responses
- Present data in a clear, organized way with bullet points or numbered lists when appropriate

The form responses contain GeoJSON data with properties that may include various field values like ratings, text responses, selections, file uploads, etc.`;

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
              *,
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

          result = {
            count: filteredData.length,
            responses: filteredData.map((r: any) => ({
              form: r.forms.title,
              created_at: r.created_at,
              data: r.geojson?.properties || {},
            })),
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
    }

    return new Response(
      JSON.stringify({ response: finalResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-responses:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
