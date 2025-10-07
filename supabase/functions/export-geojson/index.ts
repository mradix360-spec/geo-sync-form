import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const formId = url.searchParams.get('formId');
    const since = url.searchParams.get('since');

    if (!formId) {
      return new Response(
        JSON.stringify({ error: 'formId parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Use the RPC function for efficient GeoJSON generation
    const { data: geojson, error } = await supabaseClient.rpc(
      'get_form_data_geojson',
      { 
        fid: formId,
        since_timestamp: since ? new Date(since).toISOString() : null
      }
    );

    if (error) {
      console.error('Error fetching GeoJSON:', error);
      throw error;
    }

    // Get form metadata for filename and ETag
    const { data: form } = await supabaseClient
      .from('forms')
      .select('title, updated_at')
      .eq('id', formId)
      .single();

    const filename = form?.title 
      ? `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${formId.slice(0, 8)}.geojson`
      : `form_${formId}.geojson`;

    // Generate ETag from form updated_at
    const etag = form?.updated_at 
      ? `"${new Date(form.updated_at).getTime()}"`
      : `"${Date.now()}"`;

    // Check If-None-Match header for caching
    const ifNoneMatch = req.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          'ETag': etag,
          'Cache-Control': 'public, max-age=60'
        }
      });
    }

    return new Response(
      JSON.stringify(geojson, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/geo+json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'ETag': etag,
          'Last-Modified': form?.updated_at ? new Date(form.updated_at).toUTCString() : new Date().toUTCString(),
          'Cache-Control': 'public, max-age=60'
        } 
      }
    );
  } catch (error) {
    console.error('Error exporting GeoJSON:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
